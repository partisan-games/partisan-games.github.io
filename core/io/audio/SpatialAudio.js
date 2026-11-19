import Doppler from './Doppler.js'
import { resolveAudioProfile, distanceCutoff, screenMix } from './audioProfiles.js'

/** Seconds over which output follows a listener switch or teleport. */
const listenerTransitionTime = .5
/** Time constant of ordinary output smoothing between updates, in seconds. */
const smoothingTime = .03

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smoothing = dt => -Math.expm1(-dt / smoothingTime)

export function validateDistanceProfile({ nearDistance, fadeStart, maxDistance } = {}) {
  if (!Number.isFinite(nearDistance) || !Number.isFinite(fadeStart) || !Number.isFinite(maxDistance)
    || nearDistance <= 0 || nearDistance >= fadeStart || fadeStart >= maxDistance)
    throw new RangeError('Audio distances must satisfy 0 < nearDistance < fadeStart < maxDistance')
}

/** One attenuation curve for 2D and 3D; maxDistance is an actual zero, not a native panner clamp. */
export function distanceGain(distance, profile) {
  validateDistanceProfile(profile)
  if (!Number.isFinite(distance) || distance < 0) throw new RangeError('Invalid audio distance')
  const { nearDistance, fadeStart, maxDistance } = profile
  if (distance <= nearDistance) return 1
  if (distance >= maxDistance) return 0
  const fade = clamp((distance - fadeStart) / (maxDistance - fadeStart), 0, 1)
  return nearDistance / distance * (1 - fade * fade * (3 - 2 * fade))
}

const outside = (value, min, max) => Math.max(min - value, 0, value - max)

/**
 * On-screen distance gain: `span` dB from the player to the farthest screen corner, then a fade to silence just off screen.
 * Returns the gain and writes the 0..1 on-screen distance ratio into `sample`.
 */
function screenGain(listener, source, distance, { min, max }, sample) {
  const at = listener.position
  const far = Math.hypot(Math.max(at.x - min.x, max.x - at.x), Math.max(at.y - min.y, max.y - at.y), Math.max(at.z - min.z, max.z - at.z))
  sample.distanceRatio = far ? clamp(distance / far, 0, 1) : 0
  const offScreen = Math.hypot(outside(source.x, min.x, max.x), outside(source.y, min.y, max.y), outside(source.z, min.z, max.z))
  const diagonal = Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z)
  const fade = diagonal ? clamp(offScreen / (diagonal * screenMix.edgeFade), 0, 1) : 1
  return 10 ** (-sample.distanceRatio * screenMix.span / 20) * (1 - fade * fade * (3 - 2 * fade))
}

/**
 * Exact geometry of one source for one listener. `gain` may later be smoothed for output;
 * `targetGain` stays the unsmoothed distance gain. With a `viewport` (2D screen) the screen sets the distance range
 * and `screen` is true; otherwise the profile's distances do. Writes into `sample` when given.
 */
export function spatialSample(listener, source, profile, sample = {}, viewport = null) {
  const dx = source.x - listener.position.x, dy = source.y - listener.position.y, dz = source.z - listener.position.z
  const distance = Math.hypot(dx, dy, dz)
  sample.listenerPosition = listener.position
  sample.sourcePosition = source
  sample.distance = distance
  sample.screen = Boolean(viewport)
  if (viewport) sample.gain = sample.targetGain = screenGain(listener, source, distance, viewport, sample)
  else {
    sample.distanceRatio = clamp((distance - profile.nearDistance) / (profile.maxDistance - profile.nearDistance), 0, 1)
    sample.gain = sample.targetGain = distanceGain(distance, profile)
  }
  sample.pan = distance ? clamp((dx * listener.right.x + dy * listener.right.y + dz * listener.right.z) / distance, -1, 1) : 0
  sample.cutoff = distanceCutoff(profile, sample.distanceRatio)
  return sample
}

/** Smooth output values, never player/source positions. Pure simulation time; no native audio or wall clock. */
export default class SpatialAudio {
  constructor(spatial, profile, coordinates) {
    this.profile = resolveAudioProfile(profile)
    validateDistanceProfile(this.profile)
    this.spatial = spatial
    this.doppler = new Doppler(this.profile)
    this.position = spatial.position === undefined ? null : coordinates.frame().position(spatial.position)
    this.livePosition = { x: 0, y: 0, z: 0 }
    this.target = {}
    this.current = null
    this.transition = null
  }

  sourcePosition(listener, frame) {
    if (this.position) return this.position
    if (this.spatial.getArea) return frame.nearestPoint(this.spatial.getArea(), listener.position, this.livePosition)
    return frame.position(this.spatial.getPosition(), this.livePosition)
  }

  update(listener, frame, dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid audio simulation step')
    const target = spatialSample(listener, this.sourcePosition(listener, frame), this.profile, this.target, frame.viewport)
    const sourceRevision = this.spatial.getRevision ? this.spatial.getRevision() : this.spatial.revision
    const listenerChanged = listener.identity !== this.identity || listener.revision !== this.revision
    target.discontinuous = listenerChanged || sourceRevision !== this.sourceRevision
    const motion = this.doppler.update(target.distance, dt, listener, sourceRevision)
    target.dopplerRate = motion.rate

    const previousRate = this.current?.dopplerRate ?? 1
    if (!this.current) this.current = { ...target }
    else this.blend(target, listenerChanged, dt)
    const { current } = this
    current.dopplerRate = motion.reset ? 1 : previousRate + (motion.rate - previousRate) * smoothing(dt)
    current.cutoff = distanceCutoff(this.profile, current.distanceRatio)
    this.identity = listener.identity
    this.revision = listener.revision
    this.sourceRevision = sourceRevision
    return current
  }

  /** Moves output toward the exact target: a timed crossfade after a listener switch, otherwise exponential smoothing. */
  blend(target, listenerChanged, dt) {
    const { current } = this
    if (listenerChanged) this.transition = { gain: current.gain, pan: current.pan, distanceRatio: current.distanceRatio, elapsed: 0 }
    const start = this.transition ?? current
    let amount = smoothing(dt)
    if (this.transition) {
      this.transition.elapsed += dt
      amount = clamp(this.transition.elapsed / listenerTransitionTime, 0, 1)
    }
    const gain = start.gain + (target.gain - start.gain) * amount
    const pan = start.pan + (target.pan - start.pan) * amount
    const distanceRatio = start.distanceRatio + (target.distanceRatio - start.distanceRatio) * amount
    Object.assign(current, target)
    if (amount < 1) {
      current.gain = gain
      current.pan = pan
      current.distanceRatio = distanceRatio
    } else this.transition = null
  }

  resetMotion() {
    this.doppler.reset()
    if (this.current) this.current.dopplerRate = 1
  }
}
