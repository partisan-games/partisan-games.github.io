import Enemy from './Enemy.js'
/** Seconds before the boss flies away. */
export const boss = { timeLimit: 35 }

/** The big bomber at the end of a level: it keeps its nose down wherever it flies and fires from its nose and wings. */
export default class Boss extends Enemy {
  constructor({ session }) {
    super({ session, type: 'boss' })
    this.angle = Math.PI
    this.gunIndex = 0
  }

  /** It keeps its nose down while it sways. */
  face() {}

  get hitsLeft() {
    return Math.max(this.hits, 0) / this.maxHits
  }

  /** Nose, left wing and right wing in turn. */
  nextGun() {
    const offsets = [0, -.35, .35]
    const offset = offsets[this.gunIndex++ % offsets.length] * (this.width || 0)
    return { x: this.x + offset, y: this.y }
  }
}
