import optionalEffect from '../optionalEffect.js'

/**
 * A declaration owned by an object; the scene supplies its playback when the object joins it.
 * Before that, it only remembers a loop's intent and its volume.
 */
export default class SoundSource {
  constructor(file, { volume = 1, autoplay = false, ...options } = {}) {
    this.file = file
    this.options = options
    this.level = volume
    this.afterFinish = Boolean(options.afterFinish)
    this.beforeStart = Boolean(options.beforeStart)
    this.desired = false
    this.manager = null
    this.playback = null
    this.autoplay = autoplay
    this.started = false
  }

  get volume() {
    return this.level
  }
  set volume(value) {
    this.level = value
    if (this.playback) optionalEffect(this, 'sound volume', () => {
      this.playback.volume = value
    })
  }

  get active() {
    return Boolean(this.playback?.active)
  }

  bind(manager) {
    if (this.manager === manager) return
    this.detach()
    this.manager = manager
    optionalEffect(this, 'sound binding', () => {
      this.playback = manager.createSound(this.file, { ...this.options, volume: this.level })
      if (!this.options.stream && !this.options.loop) manager.output.preload(this.file, this.options.variants)
      if (this.desired && this.options.loop) this.playback.setPlaying(true)
    })
  }

  setActive(active) {
    if (!this.playback) return
    optionalEffect(this, 'sound activation', () => {
      this.playback.setActive(active)
      if (active && this.options.loop && this.playback.playing !== this.desired) this.playback.setPlaying(this.desired)
    })
    if (active && this.autoplay && !this.started) {
      this.started = true
      this.play()
    }
  }

  get playing() {
    return this.playback?.playing ?? false
  }

  play() {
    if (this.options.loop) this.desired = true
    if (!this.active) return null
    return optionalEffect(this, 'sound playback', () => this.playback.play())
  }

  setPlaying(playing) {
    const desired = Boolean(playing)
    if (this.desired === desired && (!this.playback || this.playback.playing === desired)) return
    this.desired = desired
    optionalEffect(this, 'sound loop', () => this.playback?.setPlaying(this.desired))
  }

  stop() {
    this.desired = false
    if (this.autoplay) this.started = true
    optionalEffect(this, 'sound stop', () => this.playback?.stop())
  }

  retry() {
    optionalEffect(this, 'sound retry', () => this.playback?.retry())
  }

  detach() {
    optionalEffect(this, 'sound cleanup', () => this.playback?.detach())
    this.manager = null
    this.playback = null
  }
}
