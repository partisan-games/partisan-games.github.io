import Voice, { cancelled } from './Voice.js'
import VoiceOutput from './VoiceOutput.js'

/** A reusable cursor over a shared decoded clip; each start gets a fresh native source node. */
export default class BufferedAudio extends Voice {
  constructor(session, file, options) {
    super(session, file, options)
    this.node = null
    this.buffer = null
    this.startedAt = 0
  }

  get duration() {
    return this.buffer?.duration ?? null
  }

  get currentTime() {
    let time = this.offset
    if (this.node && !this.virtual) time += (this.session.engine.context.currentTime - this.startedAt) * this.rate * this.dopplerRate
    if (!this.buffer) return time
    return this.loop && this.buffer.duration ? time % this.buffer.duration : Math.min(time, this.buffer.duration)
  }
  set currentTime(value) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid sound position')
    const resume = !this.paused
    this.pause()
    this.offset = value
    this.ended = false
    if (resume) this.play().catch(() => {})
  }

  applyLoop() {
    if (this.node) this.node.loop = this.loop
  }

  isRunning() {
    return Boolean(this.node)
  }

  setRate(base, doppler) {
    this.offset = this.currentTime
    if (this.node && !this.virtual) {
      this.startedAt = this.session.engine.context.currentTime
      this.node.playbackRate.value = base * doppler
    }
    this.rate = base
    this.dopplerRate = doppler
  }

  async startNative(request) {
    if (!this.session.canStart(this)) throw cancelled()
    const buffer = await this.session.engine.load(this.file, { signal: request.controller.signal })
    if (this.superseded(request) || !this.session.canStart(this)) throw cancelled()
    const { context } = this.session.engine
    this.buffer = buffer
    this.loudness = this.session.engine.loudnessOf(buffer)
    if (!this.stillAudible()) return
    this.offset = this.loop && buffer.duration ? this.offset % buffer.duration : Math.min(this.offset, buffer.duration)
    if (!this.processing) this.processing = new VoiceOutput(this, context)
    else this.processing.apply(this.spatialState)
    this.gain = this.processing.gain
    const node = context.createBufferSource()
    try {
      node.buffer = buffer
      node.loop = this.loop
      node.playbackRate.value = this.rate * this.dopplerRate
      node.connect(this.gain)
      node.onended = () => this.nodeEnded(node)
      this.startedAt = context.currentTime
      if (!this.session.canStart(this)) throw cancelled()
      node.start(0, this.offset)
    } catch (error) {
      node.onended = null
      node.disconnect()
      throw error
    }
    this.node = node
    this.becameAudible()
  }

  nodeEnded(node) {
    if (this.node !== node) return
    if (this.retiring) {
      this.finishRetirement()
      return
    }
    this.offset = this.buffer.duration
    this.paused = this.ended = true
    this.disconnectNode()
    this.releaseProcessing()
    this.releaseLease()
    this.dispatchEvent(new Event('ended'))
  }

  disconnectNode() {
    if (!this.node) return
    this.node.onended = null
    this.node.disconnect()
    this.node = null
  }

  stopNative() {
    const { node } = this
    this.disconnectNode()
    node?.stop()
  }

  discardStart() {
    this.releaseProcessing()
  }

  fadeNative(seconds) {
    if (!this.node) return false
    this.processing.fadeOut(seconds)
    this.node.stop(this.session.engine.context.currentTime + seconds)
    return true
  }

  finishRetirement() {
    this.disconnectNode()
    this.releaseProcessing()
    this.retiring = false
    this.releaseLease()
    if (!this.loop) this.dispose()
  }

  releaseNative() {
    this.buffer = null
  }
}
