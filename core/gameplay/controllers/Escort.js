/**
 * An escort keeps within `keep` metres of its place by its leader, matching pace as it approaches. It fights first: an
 * enemy within `sight` metres it can see stops it wherever it is, and it fires a shot every `pause` seconds at least
 * and at most, aiming within `spread` radians. When its last enemy is gone it holds `calm` seconds before it goes on,
 * so it does not run on into fire in the middle of a fight (owner, 2026-11-28).
 */
export const escort = { keep: 2, sight: 40, pause: [1.5, 3], spread: .03, calm: 3 }

/**
 * Goes with `leader` (anything with `x`, `z` and `yaw`) and fights beside it, as infantry with a tank: it stops to shoot
 * at the nearest living one of `enemies`, an array the scene keeps, that `sees(from, to)` finds in view, holds a while
 * after the fight, and otherwise keeps to its `place`, `ahead` and `side` (to the right) metres from the leader the way
 * the leader faces; a place behind the leader keeps it in the leader's lee. Hit while it sees no one to fire back at, it
 * does not wait there to be hit again but goes to its place. The body has `eye`, `hitsTaken`, `face(point)`,
 * `steer({ ahead, running })` and `attack()`; a body that can crouch, with `crouched`, crouches while it fights and
 * holds. `random` varies its aim and its pauses.
 */
export default class Escort {
  constructor(body, { leader, enemies, place = { ahead: 0, side: 0 }, sees = () => true, keep = escort.keep, sight = escort.sight,
    random = Math.random }) {
    Object.assign(this, { body, leader, enemies, place, sees, keep, sight, random })
    this.wait = this.nextPause()
    this.quiet = Infinity
    this.hits = body.hitsTaken
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

  /** Crouches the body, if it can. */
  crouch(down) {
    if ('crouched' in this.body) this.body.crouched = down
  }

  fight(target) {
    const { body } = this
    this.quiet = 0
    body.steer({ ahead: 0 })
    this.crouch(true)
    body.face(target)
    if (this.wait > 0) return
    const { eye } = body
    const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z
    const off = () => (this.random() * 2 - 1) * escort.spread
    body.yaw = Math.atan2(-dz, dx) + off()
    body.pitch = Math.atan2(dy, Math.hypot(dx, dz)) + off()
    body.attack()
    this.wait = this.nextPause()
  }

  follow() {
    const { body, post } = this
    this.crouch(false)
    const distance = Math.hypot(post.x - body.x, post.z - body.z)
    // A fixed walking speed would overtake a slow tank, then switch back to idle every few frames.
    const speed = Math.max(0, (distance - this.keep) * 2)
    if (speed <= (body.moving ? .1 : .25)) return body.steer()
    // Keep the current gait near walking speed so small changes in the tank's pace don't restart the animation.
    const running = speed > body.speed * (body.running ? .85 : 1.1)
    const pace = body.speed * (running ? body.run : 1)
    body.face(post)
    body.steer({ ahead: Math.min(1, speed / pace), running })
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    this.wait -= dt
    this.quiet += dt
    const hit = body.hitsTaken !== this.hits
    this.hits = body.hitsTaken
    const { target } = this
    if (target) return this.fight(target)
    if (hit) this.quiet = Infinity
    if (this.quiet < escort.calm) {
      body.steer()
      return this.crouch(true)
    }
    this.follow()
  }
}
