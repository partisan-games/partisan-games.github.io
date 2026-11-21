/**
 * The projectiles of one shooter: it reuses the ones out of play and finds what they hit. A projectile has
 * `active`, `state` (`flight` while it can hit), `launch(point, yaw, pitch, speed)`, `update(dt)`, `firstHit(targets)`
 * and `strike(hit)`.
 */
export default class ProjectilePool {
  constructor(create) {
    this.create = create
    this.projectiles = []
  }

  fire(point, yaw, pitch, speed) {
    const projectile = this.projectiles.find(free => !free.active) ?? this.#add()
    projectile.launch(point, yaw, pitch, speed)
    return projectile
  }

  /** Moves every projectile, then lets each in flight strike the first of `targets` its step crossed. */
  update(dt, targets = []) {
    for (const projectile of this.projectiles) {
      projectile.update(dt)
      if (projectile.state !== 'flight') continue
      const hit = projectile.firstHit(targets)
      if (hit) projectile.strike(hit)
    }
  }

  #add() {
    const projectile = this.create()
    this.projectiles.push(projectile)
    return projectile
  }
}
