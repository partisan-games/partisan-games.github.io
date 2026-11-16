/**
 * The projectiles of one shooter: it reuses the ones that are out of play and checks them against targets.
 * They go into the owner's `predmeti`, so the scene updates and draws them with the owner.
 * A projectile back in the pool is out of play, not destroyed.
 */
export default class ProjectilePool {
  constructor({ owner, create, onFire }) {
    this.owner = owner
    this.create = create
    this.onFire = onFire
    this.projectiles = []
  }

  fire(position, angle, speed) {
    const projectile = this.projectiles.find(free => !free.visible) || this.#add()
    projectile.launch(position, angle, speed)
    this.onFire?.({ projectile, position, angle })
  }

  /** Create inactive projectiles before loading assets; existing flights are left alone. */
  prepare(count = 1) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Projectile count must be a non-negative integer')
    while (this.projectiles.length < count) this.#add().reset()
  }

  /** Calls `onHit(target)` after a projectile hits one of the shown, living targets. */
  checkHits(targets, onHit) {
    targets.forEach(target => {
      if (!target.shown || target.dead) return
      this.projectiles.forEach(projectile => {
        if (projectile.shown && !target.dead) projectile.checkHit(target, () => onHit?.(target))
      })
    })
  }

  #add() {
    const projectile = this.create()
    this.projectiles.push(projectile)
    this.owner.children.push(projectile)
    return projectile
  }
}
