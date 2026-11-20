import canvas2d from '/core/io/canvas2d.js'
import { firstHit } from './lineOfFire.js'

/**
 * A shooter's weapon and hit handling, independent of its movement and appearance. It aims where it is told, fires
 * there while its owner lets it, and its shots hit the `target` and any of the `obstacles` in their way.
 */
export default class EnemyFire {
  constructor({ owner, target, obstacles = [], createWeapon, clock, groundY, muzzle, barrel }) {
    this.owner = owner
    this.target = target
    this.obstacles = obstacles
    this.barrel = barrel
    this.point = null
    this.solution = null
    this.muzzle = muzzle || (() => {
      const direction = this.point && this.point.x >= owner.x ? 1 : -1
      return { x: owner.x + direction * owner.width * .28, y: owner.y + owner.height * .1 }
    })
    this.armament = createWeapon({ owner, clock, groundY })
    this.projectiles = this.armament.projectiles
  }

  reset() {
    this.armament.reset()
  }

  /** Aims at `point`; a barrel turns to the shot that reaches it, or stays if none does. */
  aimAt(point) {
    this.point = { x: point.x, y: point.y }
    if (this.barrel) this.solution = this.barrel.aimAt(this.point, this.armament.aim)
  }

  /** Fires where it aims while `firing`; holding fire, or with the muzzle off screen, it starts its wait over. */
  update(firing) {
    let fired = false
    const origin = this.barrel ? this.barrel.muzzle : this.muzzle()
    const muzzleVisible = Number.isFinite(origin.x) && Number.isFinite(origin.y) && origin.x >= 0 && origin.x <= canvas2d.width && origin.y >= 0 && origin.y <= canvas2d.height
    if (!firing || this.owner.dead || !muzzleVisible || !this.owner.shown)
      this.reset()
    else if (!this.barrel || this.solution)
      fired = this.armament.fire(origin, this.point, this.solution?.angle)

    // Children move after their owner; retain the start of each flight segment.
    for (const projectile of this.projectiles.projectiles) {
      projectile.previousPosition = { x: projectile.x, y: projectile.y }
      projectile.wasFlying = projectile.visible && !projectile.timerId
    }
    return fired
  }

  checkHits() {
    for (const projectile of this.projectiles.projectiles) {
      if (!projectile.wasFlying || projectile.timerId) continue
      const start = projectile.previousPosition
      const end = { x: projectile.x, y: projectile.y }
      const hit = firstHit(start, end, [...this.obstacles, this.target], { x: projectile.width / 2, y: projectile.height / 2 })
      if (!hit) continue
      const time = Math.min(1, hit.time + 1e-6)
      projectile.setPosition(start.x + (end.x - start.x) * time, start.y + (end.y - start.y) * time)
      projectile.show()
      projectile.checkHit(hit.target)
      projectile.wasFlying = false
    }
  }
}
