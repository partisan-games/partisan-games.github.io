const craterRadius = 18
const craterDepth = 6
const maxDepth = 18

/**
 * The line the cannons and their crews stand on. A shell that lands on it leaves a shallow crater:
 * later shells fall into it, and a unit standing above it sinks with the ground under its foot.
 */
export default class Terrain {
  constructor({ floorY }) {
    this.floorY = floorY
    this.enabled = true
    this.craters = []
    this.units = []
  }

  /** How far the ground has sunk at x: the deepest crater there, each a round bowl. */
  depthAt(x) {
    return this.craters.reduce((deepest, crater) => {
      const reach = (x - crater.x) / crater.radius
      return Math.max(deepest, reach ** 2 < 1 ? crater.depth * (1 - reach ** 2) : 0)
    }, 0)
  }

  heightAt(x) {
    return this.floorY + this.depthAt(x)
  }

  /** A blast close to a crater deepens and widens it, instead of adding a new one beside it. */
  blast(x) {
    if (!this.enabled) return
    const crater = this.craters.find(crater => Math.abs(crater.x - x) < crater.radius / 2)
    if (crater) {
      crater.depth = Math.min(maxDepth, crater.depth + craterDepth)
      crater.radius = Math.min(craterRadius * 2, crater.radius + craterRadius / 4)
    } else this.craters.push({ x, radius: craterRadius, depth: craterDepth })
    this.settle()
  }

  /** A unit stands at `footX` (its x by default) and sinks through `standAt(depth)`. */
  support(...units) {
    this.units.push(...units)
  }

  settle() {
    for (const unit of this.units) unit.standAt(this.depthAt(unit.footX ?? unit.x))
  }

  reset() {
    this.craters = []
    this.settle()
  }
}
