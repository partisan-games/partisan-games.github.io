import { resolveAudioProfile } from './audioProfiles.js'

/**
 * Object-owned controls for one recording. Short clips are events: each play() emits an independent voice that
 * immediately belongs to the scene. Loops and streams are persistent: one voice whose cursor survives pauses.
 */
export default class SoundEmitter {
  constructor(session, file, { volume = 1, loop = false, afterFinish = false, maxDelay = .1, ...options } = {}) {
    const profile = resolveAudioProfile(options.profile, { stream: options.stream })
    session.validateSource(options.spatial, profile)
    if (!Number.isFinite(maxDelay) || maxDelay <= 0) throw new RangeError('An audio event needs a positive loading deadline')
    this.persistent = loop || Boolean(options.stream)
    if (!this.persistent && options.spatial?.getArea) throw new TypeError('An audio event needs an emission point, not a moving area')
    this.session = session
    this.file = session.engine.url(file)
    this.options = { ...options, profile, loop, afterFinish, maxDelay }
    this.afterFinish = afterFinish
    this.beforeStart = Boolean(options.beforeStart)
    this.loop = loop
    this.level = volume
    this.active = null
    this.playing = false
    this.playId = 0
    this.disposed = false
    this.failed = false
    this.audio = null
    this.voices = new Map()
  }

  get volume() {
    return this.level
  }
  set volume(value) {
    this.level = value
    if (this.persistent && this.audio && !this.audio.disposed) this.audio.volume = value
  }

  track(voice) {
    if (!voice) return null
    const release = () => {
      this.voices.delete(voice)
      if (!this.loop) this.playing = this.voices.size > 0
    }
    this.voices.set(voice, release)
    voice.addEventListener('dispose', release, { once: true })
    if (this.persistent && !this.loop) voice.addEventListener('ended', () => voice.dispose(), { once: true })
    this.audio = voice
    return voice
  }

  setActive(active) {
    if (this.disposed || this.session.disposed) return
    if (this.active === active) {
      if (active && this.persistent && this.playing && (!this.audio || this.audio.disposed)) this.resume()
      return
    }
    this.active = active
    if (!active) {
      this.playId++
      if (this.persistent) this.audio?.pause()
      return
    }
    this.session.emitters.add(this)
    if (this.persistent && this.playing) this.resume()
  }

  resume() {
    if (!this.active || this.disposed || this.failed || this.session.disposed || this.session.engine.context?.state !== 'running') return
    if (!this.audio || this.audio.disposed)
      this.track(this.session.createPlayback(this.file, this.options))
    const voice = this.audio, playId = ++this.playId
    voice.volume = this.level
    voice.play().catch(() => {
      if (this.playId !== playId) return
      this.failed = true
      this.playing = false
      voice.dispose()
    })
  }

  play() {
    if (this.disposed || this.session.disposed) return null
    if (this.persistent) {
      this.stop()
      this.setPlaying(true)
      return this.audio
    }
    if (!this.active) return null
    const voice = this.track(this.session.emit(this.file, { ...this.options, volume: this.level }))
    if (voice) this.playing = true
    return voice
  }

  /** Repeated true updates retain the same persistent voice and cursor. */
  setPlaying(playing) {
    if (!playing) {
      this.stop()
      return
    }
    if (this.disposed || this.session.disposed || this.failed || this.playing) return
    if (!this.persistent) {
      this.play()
      return
    }
    this.playing = true
    this.resume()
  }

  stop() {
    this.failed = false
    this.playId++
    this.playing = false
    for (const voice of this.voices.keys()) voice.dispose()
    this.voices.clear()
  }

  retry() {
    this.failed = false
  }

  /** Removal stops persistent and following voices; already emitted tails no longer follow the removed object. */
  detach() {
    this.active = false
    this.session.emitters.delete(this)
    if (this.persistent || this.options.follow) this.stop()
    else {
      for (const [voice, release] of this.voices) voice.removeEventListener('dispose', release)
      this.voices.clear()
      this.audio = null
      this.playing = false
    }
  }

  dispose() {
    if (this.disposed) return
    this.detach()
    this.disposed = true
  }
}
