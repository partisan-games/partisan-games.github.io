import CombatTarget from './CombatTarget.js'
import { createMachineGun } from './EnemyWeapons.js'
import EnemyFire from './EnemyFire.js'

export default class Bunker extends CombatTarget {
  constructor({ clock, target, groundY, obstacles = [], createWeapon = createMachineGun, ...rest } = {}) {
    super({ z: -1, ...rest })
    this.target = target
    this.obstacles = obstacles
    this.fire = new EnemyFire({ owner: this, target, obstacles, createWeapon, clock, groundY })
    this.projectiles = this.fire.projectiles
  }

  reset() {
    super.reset()
    this.fire.reset()
  }

  update(dt) {
    super.update(dt)
    this.fire.update()
  }

  checkHits() {
    this.fire.checkHits()
  }
}
