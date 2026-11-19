import Voice, { cancelled } from './Voice.js'
import VoiceOutput from './VoiceOutput.js'

const metadataReady = (media, signal) => {
  if (signal.aborted) return Promise.reject(cancelled())
  if (media.readyState >= 1) return Promise.resolve()
  return new Promise((resolve, reject) => {
    function cleanup() {
      media.removeEventListener('loadedmetadata', loaded)
      media.removeEventListener('error', failed)
      signal.removeEventListener('abort', aborted)
    }
    function loaded() {
      cleanup()
      resolve()
    }
    function failed() {
      cleanup()
      reject(new Error('Unable to load audio metadata'))
    }
    function aborted() {
      cleanup()
      reject(cancelled())
    }
    media.addEventListener('loadedmetadata', loaded, { once: true })
    media.addEventListener('error', failed, { once: true })
    signal.addEventListener('abort', aborted, { once: true })
    media.load()
  })
}

/**
 * Long recordings stream through the same scene and master gains as decoded effects.
 * The media element and its graph source survive pauses: an element can be connected to the graph only once.
 */
export default class StreamedAudio extends Voice {
  constructor(session, file, options) {
    super(session, file, options)
    this.media = null
    this.node = null
    this.duration = null
    this.retireUntil = null
    this.onEnded = () => {
      this.offset = this.media?.currentTime ?? this.offset
      this.ended = true
      this.paused = true
      this.retiring = false
      this.virtual = false
      this.releaseMedia()
      this.releaseLease()
      this.dispatchEvent(new Event('ended'))
    }
  }

  get currentTime() {
    return !this.virtual && this.media ? this.media.currentTime : this.offset
  }
  set currentTime(value) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid sound position')
    this.offset = value
    if (this.media && !this.virtual) this.media.currentTime = value
  }

  applyLoop() {
    if (this.media) this.media.loop = this.loop
  }

  isRunning() {
    return Boolean(this.media) && !this.media.paused && !this.virtual
  }

  setRate(base, doppler) {
    this.rate = base
    this.dopplerRate = doppler
    if (this.media && !this.virtual) this.media.playbackRate = base * doppler
  }

  async startNative(request) {
    const { signal } = request.controller
    const context = await this.session.engine.whenUnlocked({ signal })
    if (this.superseded(request) || !this.session.canPlay(this)) throw cancelled()
    this.session.preparePlayback(this)
    this.dopplerRate = this.spatialState?.dopplerRate ?? 1
    if (this.media?.error) {
      this.offset = this.media.currentTime
      this.releaseMedia()
    }
    if (!this.media) await this.prepare(context, signal)
    else {
      if (!this.processing) {
        this.processing = new VoiceOutput(this, context)
        this.gain = this.processing.gain
        this.node.connect(this.gain)
      }
      this.media.playbackRate = this.rate * this.dopplerRate
      this.processing.apply(this.spatialState)
    }
    if (this.superseded(request) || !this.session.canStart(this)) throw cancelled()
    if (!this.stillAudible()) return
    this.media.playbackRate = this.rate * this.dopplerRate
    this.processing.apply(this.spatialState, true)
    if (this.virtual && this.loop && this.duration) this.media.currentTime = this.offset % this.duration
    this.media.loop = this.loop
    await this.media.play()
    if (this.superseded(request) || !this.session.canPlay(this)) throw cancelled()
    this.becameAudible()
  }

  async prepare(context, signal) {
    const media = this.session.engine.createMedia(this.file)
    let node = null
    let processing = null
    try {
      media.preload = 'metadata'
      media.volume = 1
      await metadataReady(media, signal)
      if (signal.aborted || this.disposed) throw cancelled()
      if (this.loop && (!Number.isFinite(media.duration) || media.duration <= 0)) throw new Error('Streamed loops need a finite duration')
      this.duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : null
      media.currentTime = this.loop && this.duration ? this.offset % this.duration : this.offset
      media.playbackRate = this.rate * this.dopplerRate
      media.preservesPitch = !this.profile.doppler
      node = context.createMediaElementSource(media)
      processing = new VoiceOutput(this, context)
      node.connect(processing.gain)
      media.addEventListener('ended', this.onEnded)
      this.media = media
      this.node = node
      this.processing = processing
      this.gain = processing.gain
    } catch (error) {
      node?.disconnect()
      processing?.dispose()
      media.pause()
      media.removeAttribute('src')
      media.load()
      throw error
    }
  }

  stopNative() {
    if (!this.media) return
    this.media.pause()
    this.media.playbackRate = this.rate
    this.node.disconnect()
  }

  discardStart() {
    this.offset = this.currentTime
    this.releaseMedia()
  }

  releaseMedia() {
    if (this.media) {
      this.media.pause()
      this.media.removeEventListener('ended', this.onEnded)
      this.media.removeAttribute('src')
      this.media.load()
    }
    this.node?.disconnect()
    this.releaseProcessing()
    this.media = this.node = null
  }

  advanceVirtual(dt) {
    if (this.retiring && this.session.engine.context.currentTime >= this.retireUntil) this.finishRetirement()
    super.advanceVirtual(dt)
  }

  fadeNative(seconds) {
    if (!this.node || !this.processing) return false
    this.processing.fadeOut(seconds)
    this.retireUntil = this.session.engine.context.currentTime + seconds
    return true
  }

  finishRetirement() {
    if (this.loop && this.media) {
      this.media.preload = 'none'
      this.media.pause()
      this.node?.disconnect()
      this.releaseProcessing()
    } else this.releaseMedia()
    this.retiring = false
    this.releaseLease()
    if (!this.loop) {
      this.ended = true
      this.paused = true
      this.dispatchEvent(new Event('ended'))
    }
  }

  releaseNative() {
    this.releaseMedia()
  }
}
