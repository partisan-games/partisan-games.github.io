/** Time constant of every parameter change, in seconds: fast enough to follow motion, slow enough not to click. */
const automationTime = .015
/** Changes this large are applied at once, even for throttled distant ambience. */
const urgentPanChange = .15
const urgentDistanceChange = .5
/** Throttled ambience must be this many near distances away. */
const throttleDistance = 4

/** Keep only current automation: hold the present value before replacing the target. */
export function automate(param, value, context, immediate = false) {
  const held = param.value
  param.cancelScheduledValues(0)
  if (immediate) param.setValueAtTime(value, context.currentTime)
  else {
    param.setValueAtTime(held, context.currentTime)
    param.setTargetAtTime(value, context.currentTime, automationTime)
  }
}

/** One source-volume/trim/distance/on-screen makeup multiplication; stereo panning has no built-in distance attenuation. */
export default class VoiceOutput {
  constructor(playback, context) {
    this.playback = playback
    this.context = context
    this.sample = playback.spatialState
    this.elapsed = 0
    this.values = null
    try {
      this.gain = context.createGain()
      let last = this.gain
      if (playback.spatialModel) {
        this.filter = context.createBiquadFilter()
        this.filter.type = 'lowpass'
        // Low-pass Q is in dB; a Butterworth response avoids a resonance bump as the cutoff moves.
        this.filter.Q.value = 20 * Math.log10(Math.SQRT1_2)
        this.panner = context.createStereoPanner()
        last.connect(this.filter)
        this.filter.connect(this.panner)
        last = this.panner
      }
      last.connect(playback.session.groupDestination(playback.profile.group, context))
      this.apply(this.sample, true)
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  /** Distant, slow ambience may skip updates within its profile's outputInterval unless the change is urgent. */
  throttled(sample, pan, immediate, dt) {
    const { profile } = this.playback
    this.elapsed += dt
    if (immediate || !this.values || !profile.outputInterval || profile.critical || profile.doppler) return false
    const distance = sample?.distance ?? 0
    const urgent = sample?.discontinuous || this.playback.volume !== this.lastVolume
      || Math.abs(distance - this.lastDistance) > (profile.nearDistance ?? 1) * urgentDistanceChange
      || Math.abs(pan - this.values.pan) > urgentPanChange
    return !urgent && distance > profile.nearDistance * throttleDistance && this.elapsed < profile.outputInterval
  }

  apply(sample, immediate = false, dt = 0) {
    this.sample = sample
    const { playback, context } = this
    const { profile } = playback
    const gain = playback.volume * playback.variationVolume * profile.trim * (sample?.gain ?? 1) * playback.budget.makeup(playback)
    const pan = (sample?.pan ?? 0) * profile.panWidth
    const cutoff = Math.min(context.sampleRate * .475, sample?.cutoff ?? profile.nearCutoff)
    if (this.throttled(sample, pan, immediate, dt)) return
    this.elapsed = 0
    this.lastVolume = playback.volume
    this.lastDistance = sample?.distance ?? 0
    const values = this.values ??= {}
    if (immediate || values.gain !== gain) automate(this.gain.gain, gain, context, immediate)
    if (this.panner && (immediate || values.pan !== pan)) automate(this.panner.pan, pan, context, immediate)
    if (this.filter && (immediate || values.cutoff !== cutoff)) automate(this.filter.frequency, cutoff, context, immediate)
    values.gain = gain
    values.pan = pan
    values.cutoff = cutoff
  }

  fadeOut(seconds) {
    const { context } = this, param = this.gain.gain
    automate(param, param.value, context, true)
    param.linearRampToValueAtTime(0, context.currentTime + seconds)
  }

  fadeIn() {
    const target = this.values.gain
    automate(this.gain.gain, 0, this.context, true)
    automate(this.gain.gain, target, this.context)
  }

  dispose() {
    this.gain?.disconnect()
    this.filter?.disconnect()
    this.panner?.disconnect()
  }
}
