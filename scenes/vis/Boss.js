import Enemy from './Enemy.js'
import { settings } from './settings.js'

const { timeLimit } = settings.enemies.boss

/** The big bomber at the end of a level: it sways across the upper screen, fires from its nose and wings, and flies away if it is not shot down in time. */
export default class Boss extends Enemy {
  constructor({ session }) {
    super({ session, type: 'boss', path: 'boss' })
    this.gunIndex = 0
  }

  /** It keeps its nose down while it sways. */
  fly(dt) {
    super.fly(dt)
    this.ugao = Math.PI
  }

  routePosition(age = this.age) {
    const position = super.routePosition(age)
    const leaving = age - timeLimit
    if (leaving > 0) position.y -= this.route.speed * 3 * leaving
    return position
  }

  get hitsLeft() {
    return Math.max(this.hits, 0) / this.maxHits
  }

  /** Nose, left wing and right wing in turn. */
  nextGun() {
    const offsets = [0, -.35, .35]
    const offset = offsets[this.gunIndex++ % offsets.length] * (this.sirina || 0)
    return { x: this.x + offset, y: this.y }
  }
}
