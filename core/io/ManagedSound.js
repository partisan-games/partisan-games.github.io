import config from '/config.js'
import { createSound } from './sound.js'

/** One owner's sound. The scene enables it only while that owner belongs to the active game. */
export default class ManagedSound {
  constructor(file, { volume = 1, loop = false, afterFinish = false } = {}) {
    this.audio = createSound(file, { volume })
    this.audio.preload = 'none'
    this.audio.loop = loop
    this.volume = volume
    this.afterFinish = afterFinish
    this.active = null
    this.playing = false
    this.playId = 0
    this.audio.addEventListener('ended', () => { this.playing = false })
  }

  setActive(active) {
    this.audio.volume = Math.max(0, Math.min(1, config.volume * this.volume))
    if (this.active === active) return
    if (this.active === null && !active && !this.audio.loop) this.playing = false
    this.active = active
    if (!active) {
      this.playId++
      if (this.audio.ended) this.playing = false
      this.audio.pause()
    } else if (this.playing) this.resume()
  }

  resume() {
    this.audio.volume = Math.max(0, Math.min(1, config.volume * this.volume))
    const playId = ++this.playId
    this.audio.play().catch(() => {
      if (playId === this.playId) this.playing = false
    })
  }

  play() {
    if (this.active === false) return
    this.playing = true
    this.audio.currentTime = 0
    if (this.active) this.resume()
  }

  /** Continuous sound follows a condition, without restarting on every frame. */
  setPlaying(playing) {
    if (!playing) {
      if (this.playing) this.stop()
      return
    }
    if (this.playing) return
    this.playing = true
    if (this.active) this.resume()
  }

  stop() {
    this.playId++
    this.playing = false
    this.audio.pause()
    this.audio.currentTime = 0
  }
}
