import CombatTarget from './CombatTarget.js'
import { createMachineGun } from './BunkerWeapons.js'
import { firstHit } from './lineOfFire.js'
import platno from '/core/io/platno.js'

export default class Bunker extends CombatTarget {
  constructor({ clock, target, groundY, obstacles = [], createWeapon = createMachineGun, ...rest } = {}) {
    super({ z: -1, ...rest })
    this.target = target
    this.obstacles = obstacles
    this.armament = createWeapon({ owner: this, clock, groundY })
    this.projectiles = this.armament.projectiles
  }

  reset() {
    super.reset()
    this.armament.reset()
  }

  update(dt) {
    super.update(dt)
    this.updateFire()
    // Children move after their owner; retain the start of each flight segment.
    for (const projectile of this.projectiles.projectiles) {
      projectile.previousPosition = { x: projectile.x, y: projectile.y }
      projectile.wasFlying = projectile.vidljiv && !projectile.timerId
    }
  }

  updateFire() {
    const direction = this.target.x < this.x ? -1 : 1
    const origin = { x: this.x + direction * this.sirina * .28, y: this.y + this.visina * .1 }
    const muzzleVisible = Number.isFinite(origin.x) && Number.isFinite(origin.y) && origin.x >= 0 && origin.x <= platno.width && origin.y >= 0 && origin.y <= platno.height
    if (this.dead || !muzzleVisible || !this.prikazan || this.target.dead || !this.target.prikazan) {
      this.armament.reset()
      return
    }
    this.armament.fire(origin, this.target)
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
