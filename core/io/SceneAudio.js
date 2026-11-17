/** Finds sounds through ownership, including non-drawable parts; never shares playback between scenes. */
export default class SceneAudio {
  constructor() {
    this.sounds = new Set()
    this.ended = false
  }

  sync(roots, state) {
    if (this.ended) return
    const sounds = new Set()
    const visited = new Set()
    const visit = object => {
      if (!object || visited.has(object)) return
      visited.add(object)
      object.sounds?.forEach(sound => sounds.add(sound))
      object.children?.forEach(visit)
      object.audioChildren?.forEach(visit)
      visit(object.flame)
    }
    roots.forEach(visit)
    this.sounds.forEach(sound => {
      if (!sounds.has(sound)) {
        sound.setActive(false)
        sound.stop()
      }
    })
    sounds.forEach(sound => sound.setActive(state === 'running' || (state === 'finished' && sound.afterFinish)))
    this.sounds = sounds
  }

  end() {
    this.ended = true
    this.sounds.forEach(sound => {
      sound.setActive(false)
      sound.stop()
    })
    this.sounds.clear()
  }
}
