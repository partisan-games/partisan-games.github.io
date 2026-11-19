/** Several owners in the same declared area control one ambient loop; independent areas never share a voice. */
export default class AmbientEmitter {
  constructor(session, file, options) {
    this.session = session
    this.file = file
    this.options = options
    this.level = options.volume ?? 1
    this.afterFinish = options.afterFinish ?? false
    this.active = false
    this.playing = false
    this.disposed = false
    this.entry = null
  }

  get audio() {
    return this.entry?.emitter.audio ?? null
  }

  get volume() {
    return this.level
  }
  set volume(value) {
    if (value === this.level) return
    this.level = value
    this.sync()
  }

  setActive(active) {
    if (this.disposed || this.session.disposed) return
    this.active = active
    if (active && !this.entry) this.session.attachAmbience(this)
    this.sync()
  }

  setPlaying(playing) {
    if (this.disposed || this.session.disposed) return
    this.playing = Boolean(playing)
    this.sync()
  }

  play() {
    this.setPlaying(true)
    return this.audio
  }

  stop() {
    this.setPlaying(false)
  }

  retry() {
    this.entry?.emitter.retry()
  }

  /** The shared loop is active if any owner is, and as loud as its loudest playing owner. */
  sync() {
    if (!this.entry) return
    let active = false, playing = false, volume = 0
    for (const owner of this.entry.owners) {
      if (owner.active) active = true
      if (!owner.playing) continue
      playing = true
      volume = Math.max(volume, owner.level)
    }
    const { emitter } = this.entry
    emitter.volume = volume
    emitter.setActive(active)
    emitter.setPlaying(playing)
  }

  detach() {
    this.active = this.playing = false
    const { entry } = this
    if (!entry) return
    entry.owners.delete(this)
    this.sync()
    if (!entry.owners.size) {
      entry.emitter.dispose()
      this.session.ambiences.delete(this.options.ambienceKey)
    }
    this.entry = null
  }

  dispose() {
    this.detach()
    this.disposed = true
  }
}
