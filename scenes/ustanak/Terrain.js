/** The crater shape the owner approved: 120 px wide, up to 24 px deep, uneven, in 2 px columns. */
export const crater = Object.freeze({ halfWidth: 60, depth: 24, column: 2 })
/** Pixels per second squared at which a unit falls to lower ground. */
const gravity = 900

/** Depth of each 2 px column across one crater, from left to right: a shallow bowl with an uneven floor and a ragged lip. */
export function craterProfile(random = Math.random) {
  const { halfWidth, depth, column } = crater
  const a = random() * Math.PI * 2, b = random() * Math.PI * 2
  const depths = []
  for (let left = -halfWidth; left < halfWidth; left += column) {
    const t = (left + column / 2) / halfWidth
    const bowl = depth * (1 - t * t) ** .7
    const uneven = 1 + .18 * Math.sin(3 * t + a) + .1 * Math.sin(7 * t + b)
    const ragged = Math.abs(t) > .7 && random() < 1 / 3 ? column : 0
    depths.push(Math.max(0, Math.round(bowl * uneven / column) * column - ragged))
  }
  return depths
}

/**
 * The ground the cannons and their crews stand on, as a height for every pixel column of the screen.
 * A shell cuts a crater into it: later shells fall into the hole, and units standing above it fall with the ground.
 * `view` draws the same craters (see GroundLayer). Without a `width` the ground stays flat, as for a lone cannon.
 */
export default class Terrain {
  constructor({ floorY, width = 0, bottom = Infinity, random = Math.random }) {
    this.floorY = floorY
    this.bottom = bottom
    this.random = random
    this.enabled = true
    this.heights = new Float32Array(Math.ceil(width)).fill(floorY)
    this.units = new Map()
    this.view = null
  }

  heightAt(x) {
    const column = Math.floor(x)
    return column >= 0 && column < this.heights.length ? this.heights[column] : this.floorY
  }

  /**
   * Cuts a crater whose top is the ground where the shell landed; a blast in a hole deepens it, down to the bottom.
   * Returns the crater's floor for each 2 px column from `left`, the shape `view` draws.
   */
  blast(x) {
    if (!this.enabled) return null
    const left = Math.round(x / crater.column) * crater.column - crater.halfWidth
    const top = this.heightAt(x)
    const cut = { left, floors: craterProfile(this.random).map(depth => Math.min(this.bottom, top + depth)) }
    cut.floors.forEach((floor, i) => {
      for (let column = left + i * crater.column; column < left + (i + 1) * crater.column; column++)
        if (column >= 0 && column < this.heights.length) this.heights[column] = Math.max(this.heights[column], floor)
    })
    this.view?.cut(cut)
    return cut
  }

  /** A unit stands at `footX` (its x by default) and sinks through `standAt(depth)`. */
  support(...units) {
    for (const unit of units) this.units.set(unit, { depth: 0, speed: 0 })
  }

  depthUnder(unit) {
    return this.heightAt(unit.footX ?? unit.x) - this.floorY
  }

  /** Units fall to lower ground with gravity; ground that rises under them lifts them at once. */
  update(dt) {
    for (const [unit, fall] of this.units) {
      const target = this.depthUnder(unit)
      if (fall.depth === target) continue
      if (fall.depth > target) {
        fall.depth = target
        fall.speed = 0
      } else {
        fall.speed += gravity * dt
        fall.depth = Math.min(target, fall.depth + fall.speed * dt)
        if (fall.depth === target) fall.speed = 0
      }
      unit.standAt(fall.depth)
    }
  }

  reset() {
    this.heights.fill(this.floorY)
    for (const [unit, fall] of this.units) {
      fall.depth = fall.speed = 0
      unit.standAt(0)
    }
    this.view?.reset()
  }
}
