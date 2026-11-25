/**
 * An escort keeps within `keep` metres of its place beside its leader, running when it falls more than twice that
 * behind; more than `stray` metres off, it only runs back. It fires at enemies within `sight` metres it can see, a
 * shot every `pause` seconds at least and at most, aiming within `spread` radians.
 */
export const escort = { keep: 2, stray: 6, sight: 40, pause: [1.5, 3], spread: .03 }

/**
 * Goes with `leader` (anything with `x`, `z` and `yaw`) and fights beside it: it stops to shoot at the nearest living
 * one of `enemies`, an array the scene keeps, that `sees(from, to)` finds in view, unless it has strayed from its `place`,
 * `ahead` and `side` (to the right) metres from the leader the way the leader faces, which it keeps to otherwise. The body has `eye`,
 * `face(point)`, `steer({ ahead, running })` and `attack()`; `random` varies its aim and its pauses.
 */
export default class Escort {
  constructor(body, { leader, enemies, place = { ahead: 0, side: 0 }, sees = () => true, keep = escort.keep, sight = escort.sight,
    random = Math.random }) {
    Object.assign(this, { body, leader, enemies, place, sees, keep, sight, random })
    this.wait = this.nextPause()
  }

  nextPause() {
    const [least, most] = escort.pause
    return least + this.random() * (most - least)
  }

  /** Where it belongs beside its leader now. */
  get post() {
    const { leader, place } = this
    const yaw = leader.yaw ?? 0
    return {
      x: leader.x + Math.cos(yaw) * place.ahead + Math.sin(yaw) * place.side,
      z: leader.z - Math.sin(yaw) * place.ahead + Math.cos(yaw) * place.side,
    }
  }

  /** The nearest living enemy within sight that nothing hides, or null. */
  get target() {
    const { body } = this
    let nearest = null, nearestDistance = this.sight
    for (const enemy of this.enemies) {
      const distance = Math.hypot(enemy.x - body.x, enemy.z - body.z)
      if (enemy.alive && distance < nearestDistance && this.sees(body, enemy)) [nearest, nearestDistance] = [enemy, distance]
    }
    return nearest
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    this.wait -= dt
    const { post } = this
    const distance = Math.hypot(post.x - body.x, post.z - body.z)
    // left behind, it catches up with its leader before it fights
    const target = distance > escort.stray ? null : this.target
    if (target) {
      body.steer({ ahead: 0 })
      body.face(target)
      if (this.wait > 0) return
      const { eye } = body
      const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z
      const off = () => (this.random() * 2 - 1) * escort.spread
      body.yaw = Math.atan2(-dz, dx) + off()
      body.pitch = Math.atan2(dy, Math.hypot(dx, dz)) + off()
      body.attack()
      this.wait = this.nextPause()
      return
    }
    if (distance <= this.keep) return body.steer({ ahead: 0 })
    body.face(post)
    body.steer({ ahead: 1, running: distance > this.keep * 2 })
  }
}
