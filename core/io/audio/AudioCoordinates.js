const isPoint = (value, dimensions) => Boolean(value) && Number.isFinite(value.x) && Number.isFinite(value.y)
  && (dimensions === 2 || Number.isFinite(value.z))

const assertPoint = (value, dimensions) => {
  if (!isPoint(value, dimensions)) throw new TypeError('Audio coordinates need finite world positions')
}

const unit = (x, y, z) => {
  const length = Math.hypot(x, y, z)
  if (!Number.isFinite(length) || !length) throw new RangeError('Audio orientation needs a nonzero direction')
  return { x: x / length, y: y / length, z: z / length }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/** One world-offset snapshot, shared by the player and every moving source within the same update. */
class AudioFrame {
  constructor(coordinates, offset) {
    this.dimensions = coordinates.dimensions
    this.scale = coordinates.unitsPerAudioUnit
    this.offset = offset
    this.viewport = coordinates.getViewport ? this.box(coordinates.getViewport()) : null
  }

  /** A world-space box in acoustic coordinates. */
  box(bounds) {
    const { min, max } = bounds ?? {}
    assertPoint(min, this.dimensions)
    assertPoint(max, this.dimensions)
    if (min.x > max.x || min.y > max.y || (this.dimensions === 3 && min.z > max.z)) throw new RangeError('Invalid audio area bounds')
    const first = this.position(min), second = this.position(max)
    return {
      min: { x: Math.min(first.x, second.x), y: Math.min(first.y, second.y), z: Math.min(first.z, second.z) },
      max: { x: Math.max(first.x, second.x), y: Math.max(first.y, second.y), z: Math.max(first.z, second.z) },
    }
  }

  /** Acoustic coordinate of one axis; 2D world y grows downwards and has no depth. */
  axis(value, key) {
    if (key === 'z' && this.dimensions === 2) return 0
    const converted = (value[key] + this.offset[key]) / this.scale
    return key === 'y' && this.dimensions === 2 ? -converted : converted
  }

  /** Writes into `out` when given, so per-frame callers allocate nothing. */
  position(value, out = {}) {
    assertPoint(value, this.dimensions)
    out.x = this.axis(value, 'x')
    out.y = this.axis(value, 'y')
    out.z = this.axis(value, 'z')
    return out
  }

  /** The closest point of a world-space box to an acoustic position; a position inside is its own closest point. */
  nearestPoint(bounds, position, out = {}) {
    const { min, max } = bounds ?? {}
    assertPoint(min, this.dimensions)
    assertPoint(max, this.dimensions)
    if (min.x > max.x || min.y > max.y || (this.dimensions === 3 && min.z > max.z)) throw new RangeError('Invalid audio area bounds')
    for (const key of ['x', 'y', 'z']) {
      const first = this.axis(min, key), second = this.axis(max, key)
      out[key] = clamp(position[key], Math.min(first, second), Math.max(first, second))
    }
    return out
  }

  listener(player) {
    if (!player) throw new TypeError('Spatial audio needs its actual player')
    let right = { x: 1, y: 0, z: 0 }
    if (this.dimensions === 3) {
      assertPoint(player.forward, 3)
      assertPoint(player.up, 3)
      const forward = unit(player.forward.x, player.forward.y, player.forward.z)
      const up = unit(player.up.x, player.up.y, player.up.z)
      right = unit(
        forward.y * up.z - forward.z * up.y,
        forward.z * up.x - forward.x * up.z,
        forward.x * up.y - forward.y * up.x,
      )
    }
    return { position: this.position(player.position), right, identity: player.identity ?? player, revision: player.revision }
  }
}

/**
 * Converts world units only: cameras, canvas size and render-layer z never move a position.
 * An optional `getViewport` returns the world box seen on screen; it decides only what is on screen, not where things are.
 */
export default class AudioCoordinates {
  constructor({ dimensions, unitsPerAudioUnit, getWorldOffset = null, getViewport = null } = {}) {
    if (dimensions !== 2 && dimensions !== 3) throw new RangeError('Audio dimensions must be 2 or 3')
    if (!Number.isFinite(unitsPerAudioUnit) || unitsPerAudioUnit <= 0)
      throw new RangeError('Audio needs a positive world-unit scale')
    if (getWorldOffset !== null && typeof getWorldOffset !== 'function')
      throw new TypeError('getWorldOffset must be a function')
    if (getViewport !== null && typeof getViewport !== 'function')
      throw new TypeError('getViewport must be a function')
    this.dimensions = dimensions
    this.unitsPerAudioUnit = unitsPerAudioUnit
    this.getWorldOffset = getWorldOffset
    this.getViewport = getViewport
  }

  frame() {
    if (!this.getWorldOffset) return new AudioFrame(this, { x: 0, y: 0, z: 0 })
    const offset = this.getWorldOffset()
    assertPoint(offset, this.dimensions)
    return new AudioFrame(this, { x: offset.x, y: offset.y, z: this.dimensions === 2 ? 0 : offset.z })
  }
}
