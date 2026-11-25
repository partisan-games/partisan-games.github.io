import audioEngine from './AudioEngine.js'
import optionalEffect from '../optionalEffect.js'

/**
 * Finds sounds through ownership, including non-drawable parts; never shares playback between scenes.
 * Games add and remove nested objects directly, so every sync walks the owner tree; it reuses its sets to allocate nothing.
 */
export default class SceneAudio {
  constructor({ engine = audioEngine, ...spatialContext } = {}) {
    this.engine = engine
    this.output = engine.createSession(spatialContext)
    this.sounds = new Set()
    /** Sounds found by the walk in progress; `spare` is the emptied set the next sync reuses. */
    this.found = this.sounds
    this.spare = new Set()
    this.visited = new Set()
    this.state = null
    this.ended = false
  }

  createSound(file, options = {}) {
    return this.output.createEmitter(file, options)
  }

  async unlock() {
    const context = await this.engine.unlock()
    if (!this.ended) this.sounds.forEach(sound => sound.retry())
    return context
  }

  setSpatialContext(options) {
    this.output.setSpatialContext(options)
  }

  setGroupVolume(group, volume) {
    this.output.setGroupVolume(group, volume)
  }

  update(dt) {
    optionalEffect(this, 'audio update', () => this.output.update(dt))
  }

  allowed(sound) {
    return this.state === 'running' || (this.state === 'finished' && sound.afterFinish)
      || (this.state === 'ready' && sound.beforeStart)
  }

  /** Roots may be objects or arrays of objects. */
  visit(object) {
    if (!object || this.visited.has(object)) return
    if (Array.isArray(object)) {
      for (const item of object) this.visit(item)
      return
    }
    this.visited.add(object)
    object.audioScene = this
    // A declaration binds itself; a handle made by createSound already belongs to this scene.
    if (object.sounds) for (const sound of object.sounds) {
      optionalEffect(sound, 'audio binding', () => {
        sound.bind?.(this)
        sound.setActive(this.allowed(sound))
      })
      this.found.add(sound)
    }
    if (object.children) for (const child of object.children) this.visit(child)
    if (object.audioChildren) for (const child of object.audioChildren) this.visit(child)
  }

  collect(roots) {
    this.visited.clear()
    for (const root of roots) this.visit(root)
    this.visited.clear()
  }

  /** Pooled children must join before launch, rather than lose their first event until the next frame. */
  attach(object) {
    if (this.ended) return
    this.found = this.sounds
    this.collect([object])
  }

  emit(file, options) {
    if (this.ended) return null
    return optionalEffect(this, `audio event: ${file}`, () => this.output.emit(file, options))
  }

  sync(roots, state) {
    return optionalEffect(this, 'audio sync', () => this.syncSources(roots, state))
  }

  syncSources(roots, state) {
    if (this.ended) return
    this.engine.syncVolume()
    this.state = state
    this.output.setState(state)
    const found = this.found = this.spare
    found.clear()
    this.collect(roots)
    const previous = this.sounds
    for (const sound of previous) if (!found.has(sound)) sound.detach()
    previous.clear()
    this.spare = previous
    this.sounds = found
  }

  end() {
    this.ended = true
    this.sounds.forEach(sound => {
      optionalEffect(sound, 'audio cleanup', () => {
        sound.setActive(false)
        sound.stop()
      })
    })
    this.sounds.clear()
    optionalEffect(this, 'audio cleanup', () => this.output.dispose())
  }
}
