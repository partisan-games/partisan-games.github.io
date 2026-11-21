/** The crater shape the owner approved: 120 px wide, up to 24 px deep, uneven, in 2 px columns. */
export const crater = Object.freeze({ halfWidth: 60, depth: 24, column: 2 })
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
 * The ground the guns and their crews stand on, as a height for every pixel column of the screen, y down.
 * A shot cuts a crater into it: later shots fall into the hole, and what stands above it falls with the ground, which
 * the scene gives the bodies as their ground. `view` draws the same craters (see GroundLayer). Without a `width` the
 * ground stays flat.
 */
export default class Terrain {
  constructor({ floorY, width = 0, bottom = Infinity, random = Math.random }) {
    this.floorY = floorY
    this.bottom = bottom
    this.random = random
    this.enabled = true
    this.heights = new Float32Array(Math.ceil(width)).fill(floorY)
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

  reset() {
    this.heights.fill(this.floorY)
    this.view?.reset()
  }
}
