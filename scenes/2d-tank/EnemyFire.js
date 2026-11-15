import platno from '/core/io/platno.js'
import { firstHit } from './lineOfFire.js'

/** A shooter's weapon and hit handling, independent of its movement and appearance. */
export default class EnemyFire {
  constructor({ owner, target, obstacles = [], createWeapon, clock, groundY, muzzle, barrel }) {
    this.owner = owner
    this.target = target
    this.obstacles = obstacles
    this.barrel = barrel
    this.muzzle = muzzle || (() => {
      const direction = target.x < owner.x ? -1 : 1
      return { x: owner.x + direction * owner.sirina * .28, y: owner.y + owner.visina * .1 }
    })
    this.armament = createWeapon({ owner, clock, groundY })
    this.projectiles = this.armament.projectiles
  }

  reset() {
    this.armament.reset()
  }

  update(enabled = true) {
    let fired = false
    const solution = this.barrel && enabled && !this.owner.dead
      ? this.barrel.aimAt(this.target, this.armament.aim) : null
    const origin = this.barrel ? (solution?.origin || this.barrel.muzzle) : this.muzzle()
    const muzzleVisible = Number.isFinite(origin.x) && Number.isFinite(origin.y) && origin.x >= 0 && origin.x <= platno.width && origin.y >= 0 && origin.y <= platno.height
    if (!enabled || this.owner.dead || !muzzleVisible || !this.owner.prikazan || this.target.dead || !this.target.prikazan)
      this.reset()
    else if (!this.barrel || solution)
      fired = this.armament.fire(origin, this.target, solution?.angle)

    // Children move after their owner; retain the start of each flight segment.
    for (const projectile of this.projectiles.projectiles) {
      projectile.previousPosition = { x: projectile.x, y: projectile.y }
      projectile.wasFlying = projectile.vidljiv && !projectile.timerId
    }
    return fired
  }

  checkHits() {
    for (const projectile of this.projectiles.projectiles) {
      if (!projectile.wasFlying || projectile.timerId) continue
      const start = projectile.previousPosition
      const end = { x: projectile.x, y: projectile.y }
      const hit = firstHit(start, end, [...this.obstacles, this.target], { x: projectile.sirina / 2, y: projectile.visina / 2 })
      if (!hit) continue
      const time = Math.min(1, hit.time + 1e-6)
      projectile.postavi(start.x + (end.x - start.x) * time, start.y + (end.y - start.y) * time)
      projectile.pokazi()
      projectile.proveriPogodak(hit.target)
      projectile.wasFlying = false
    }
  }
}
