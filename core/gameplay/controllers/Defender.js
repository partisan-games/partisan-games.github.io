/** The seconds between a defender's shots, at least and at most, and how far off his aim may be, in radians each way. */
export const defender = { pause: [2, 4], spread: .02 }

/**
 * Holds a position: now and then the body fires at one of the living `enemies` it can hit, an array the scene keeps,
 * picked by `random`, aiming a little off, so he misses a far one more often than a near one. An enemy can be hit
 * unless it is not `exposed`, as one behind cover. The body has `eye`, `yaw`, `pitch` and `attack()`.
 */
export default class Defender {
  constructor(body, { enemies, pause = defender.pause, spread = defender.spread, random = Math.random }) {
    Object.assign(this, { body, enemies, pause, spread, random })
    this.wait = this.nextPause()
  }

  nextPause() {
    const [least, most] = this.pause
    return least + this.random() * (most - least)
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    this.wait -= dt
    if (this.wait > 0) return
    const targets = this.enemies.filter(enemy => enemy.alive && enemy.exposed !== false)
    if (!targets.length) return
    const target = targets[Math.floor(this.random() * targets.length)]
    const { eye } = body
    const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z
    const off = () => (this.random() * 2 - 1) * this.spread
    body.yaw = Math.atan2(-dz, dx) + off()
    body.pitch = Math.atan2(dy, Math.hypot(dx, dz)) + off()
    body.attack()
    this.wait = this.nextPause()
  }
}
