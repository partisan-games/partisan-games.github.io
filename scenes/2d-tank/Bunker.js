import CombatTarget from './CombatTarget.js'
import { createMachineGun } from './EnemyWeapons.js'
import EnemyFire from './EnemyFire.js'

export default class Bunker extends CombatTarget {
  constructor({ clock, target, groundY, obstacles = [], createWeapon = createMachineGun, nextSpawnX, ...rest } = {}) {
    super({ z: -1, ...rest })
    this.target = target
    this.obstacles = obstacles
    this.fire = new EnemyFire({ owner: this, target, obstacles, createWeapon, clock, groundY })
    this.projectiles = this.fire.projectiles
    this.nextSpawnX = nextSpawnX
  }

  reset() {
    super.reset()
    this.fire.reset()
  }

  proveriGranice() {
    if (!this.nextSpawnX) return super.proveriGranice()
    if (!Number.isFinite(this.sirina) || this.x + this.sirina / 2 >= 0) return
    this.x = this.nextSpawnX()
    this.wrapElapsed = 0
    this.reset()
  }

  update(dt) {
    super.update(dt)
    this.fire.update()
  }

  checkHits() {
    this.fire.checkHits()
  }
}
