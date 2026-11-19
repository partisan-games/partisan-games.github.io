import { voiceLimits } from './audioProfiles.js'

export const cancelled = () => new DOMException('Sound playback cancelled', 'AbortError')

/**
 * One playback cursor and its budget slot; subclasses own only the native source (a decoded buffer or a media element).
 *
 * Wanted state: `paused` (not wanted), `ended` (a one-shot reached its end), `disposed`.
 * Native state of a wanted voice: `pending` (a start request is loading or waiting for a slot), playing, `retiring`
 * (fading out its native source), or `virtual` (a loop kept silent without a native source, its cursor still moving).
 */
export default class Voice extends EventTarget {
  constructor(session, file, {
    loop = false, profile, spatial = null, spatialModel = null,
    afterFinish = false, beforeStart = false, steady = false, mixOffset = 0, variationVolume = 1, playbackRate = 1,
  }) {
    super()
    this.session = session
    this.file = file
    this.profile = profile
    this.spatial = spatial
    this.spatialModel = spatialModel
    this.spatialState = null
    this.afterFinish = afterFinish
    this.beforeStart = beforeStart
    /** A steady sound that stays with the player, raised on screen only to the audibility floor. */
    this.steady = steady
    /** Decibels added after the on-screen audibility raise, which a lower `volume` alone cannot undo. */
    if (!Number.isFinite(mixOffset)) throw new RangeError('mixOffset must be a finite number of decibels')
    this.mixOffset = mixOffset
    this.variationVolume = variationVolume
    /** RMS of the recording; unknown until decoded, and streams are never measured, so full scale until then. */
    this.loudness = 1
    this.loop = loop
    this.rate = playbackRate
    this.dopplerRate = 1
    this.level = 1
    this.offset = 0
    this.paused = true
    this.ended = false
    this.disposed = false
    this.virtual = false
    this.retiring = false
    this.pending = null
    this.lease = null
    this.processing = null
    this.gain = null
    /** Loading deadline of a one-shot event; set by the session, cleared once it starts. */
    this.expiresAt = null
  }

  get budget() {
    return this.session.engine.budget
  }

  get loop() {
    return this.looping
  }
  set loop(value) {
    const loop = Boolean(value)
    if (loop !== this.looping && this.budget.active.has(this)) throw new Error('Pause a voice before changing its loop mode')
    this.looping = loop
    this.applyLoop()
  }

  get volume() {
    return this.level
  }
  set volume(value) {
    const level = Math.max(0, Math.min(1, value))
    if (level === this.level) return
    this.level = level
    if (!this.retiring) this.processing?.apply(this.spatialState)
  }

  get playbackRate() {
    return this.rate
  }
  set playbackRate(value) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('Invalid sound playback rate')
    this.setRate(value, this.dopplerRate)
  }

  applySpatial(sample, dt = 0) {
    if (this.dopplerRate !== sample.dopplerRate) this.setRate(this.rate, sample.dopplerRate)
    if (!this.retiring) this.processing?.apply(sample, false, dt)
  }

  /** A start request that a newer pause, retirement or disposal has replaced. */
  superseded(request) {
    return this.disposed || this.pending !== request || request.controller.signal.aborted
  }

  play() {
    if (this.disposed || !this.session.canPlay(this)) return Promise.reject(cancelled())
    if (this.pending) return this.pending.promise
    if (this.retiring || this.isRunning()) return Promise.resolve()
    if (this.ended) {
      this.offset = 0
      this.ended = false
    }
    this.paused = false
    const request = { controller: new AbortController() }
    this.pending = request
    request.promise = this.start(request)
    return request.promise
  }

  /** A refused one-shot rejects before play() returns, so its caller can drop it at once. */
  async start(request) {
    try {
      this.session.preparePlayback(this)
      request.lease = this.budget.request(this, request.controller.signal)
      if (!request.lease) {
        if (!this.loop) throw cancelled()
        this.virtual = true
        return
      }
      this.lease = request.lease
      const admitted = await request.lease.ready
      if (!admitted && this.loop && !request.controller.signal.aborted) {
        this.virtual = true
        return
      }
      if (!admitted || request.controller.signal.aborted) throw cancelled()
      await this.startNative(request)
    } catch (error) {
      // A retirement that interrupted this start owns the cleanup and the slot.
      if (request.retired && this.retiring) return
      this.budget.release(this, request.lease)
      if (request.virtualized) return
      if (this.pending === request) {
        this.paused = true
        this.discardStart()
      }
      throw error
    } finally {
      if (this.pending === request) this.pending = null
    }
  }

  /** Samples the position again after loading; a source that went silent meanwhile stays virtual (loop) or is dropped. */
  stillAudible() {
    this.session.preparePlayback(this)
    this.dopplerRate = this.spatialState?.dopplerRate ?? 1
    if (this.budget.audible(this)) return true
    this.virtual = this.loop
    this.finishRetirement()
    if (this.loop) return false
    throw cancelled()
  }

  becameAudible() {
    this.expiresAt = null
    const wasVirtual = this.virtual
    this.virtual = false
    if (wasVirtual) this.processing.fadeIn()
  }

  pause() {
    this.offset = this.currentTime
    this.paused = true
    this.pending?.controller.abort()
    this.pending = null
    this.stopNative()
    this.releaseProcessing()
    this.retiring = false
    this.dopplerRate = 1
    this.releaseLease()
  }

  releaseProcessing() {
    this.processing?.dispose()
    this.processing = null
    this.gain = null
  }

  releaseLease() {
    this.budget.release(this, this.lease)
    this.lease = null
  }

  advanceVirtual(dt) {
    if (!this.virtual || this.paused) return
    this.offset += dt * this.rate * this.dopplerRate
    if (this.duration) this.offset %= this.duration
  }

  /** Silent voices give up their native source; virtual loops come back when audible and a slot is free. */
  reconcile() {
    if (this.paused || this.disposed || this.retiring) return
    const audible = this.budget.audible(this)
    if (!audible && !this.virtual) this.retire()
    else if (this.loop && audible && this.virtual && !this.pending && this.budget.accepts(this)) this.play().catch(() => {})
  }

  retire() {
    if (this.retiring || this.disposed) return
    this.offset = this.currentTime
    this.virtual = this.loop
    this.retiring = true
    if (this.pending) {
      this.pending.virtualized = this.loop
      this.pending.retired = true
      if (!this.node) this.pending.controller.abort()
      this.pending = null
    }
    if (!this.fadeNative(voiceLimits.fade)) this.finishRetirement()
  }

  dispose() {
    if (this.disposed) return
    this.pause()
    this.disposed = true
    this.releaseNative()
    this.session.releasePlayback(this)
    this.dispatchEvent(new Event('dispose'))
  }
}
