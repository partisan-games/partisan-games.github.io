/**
 * The projectiles of one shooter: it reuses the ones that are out of play and checks them against targets.
 * They go into the owner's `predmeti`, so the scene updates and draws them with the owner.
 * A projectile back in the pool is out of play, not destroyed.
 */
export default class ProjectilePool {
  constructor({ owner, create }) {
    this.owner = owner
    this.create = create
    this.projectiles = []
  }

  fire(position, angle, speed) {
    const projectile = this.projectiles.find(free => !free.vidljiv) || this.#add()
    projectile.pali(position, angle, speed)
  }

  /** Calls `onHit(target)` after a projectile hits one of the shown, living targets. */
  checkHits(targets, onHit) {
    targets.forEach(target => {
      if (!target.prikazan || target.dead) return
      this.projectiles.forEach(projectile => {
        if (projectile.prikazan && !target.dead) projectile.proveriPogodak(target, () => onHit?.(target))
      })
    })
  }

  #add() {
    const projectile = this.create()
    this.projectiles.push(projectile)
    this.owner.predmeti.push(projectile)
    return projectile
  }
}
