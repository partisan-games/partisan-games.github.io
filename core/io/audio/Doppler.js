/** Average radial speed comes from exact geometric distances, never smoothed output values. */
export default class Doppler {
  constructor(profile) {
    this.profile = profile
    this.motion = { rate: 1, reset: true }
    this.reset()
  }

  reset() {
    this.previous = null
    this.motion.rate = 1
    this.motion.reset = true
  }

  update(distance, dt, listener, sourceRevision) {
    if (!this.profile.doppler) return this.motion
    const { previous } = this
    const oldDistance = previous?.distance
    const reset = !previous || dt <= 0 || previous.identity !== listener.identity
      || previous.revision !== listener.revision || previous.sourceRevision !== sourceRevision
    this.previous ||= {}
    this.previous.distance = distance
    this.previous.identity = listener.identity
    this.previous.revision = listener.revision
    this.previous.sourceRevision = sourceRevision
    this.motion.reset = reset
    if (reset) {
      this.motion.rate = 1
      return this.motion
    }
    const radialSpeed = (distance - oldDistance) / dt
    const { soundSpeed, minRate, maxRate } = this.profile
    const rate = soundSpeed / Math.max(soundSpeed * .1, soundSpeed + radialSpeed)
    this.motion.rate = Math.max(minRate, Math.min(maxRate, rate))
    return this.motion
  }
}
