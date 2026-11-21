import StateMachine from '/core/gameplay/StateMachine.js'
import CombatTarget from './CombatTarget.js'
import { createMachineGun } from './EnemyWeapons.js'
import EnemyFire from './EnemyFire.js'

/** The bunker holds fire, or fires where it aims, or stands destroyed; who sets it, and when, is up to the world. */
const states = {
  idle: {},
  fire: {},
  dead: {
    enter: bunker => bunker.die(),
  },
}

/**
 * A fortified gun on the roadside. Its shots hit the `target` and any `obstacles` in their way. The world may give it a
 * `controller`, which chooses its state once the bunker has moved each frame. A bunker with a `gunner` (a
 * MachineGunner, as in the game Bunker) is manned: he stands at its door and fires its bursts, his own way, instead of
 * a hidden gun, and falls with it.
 */
export default class Bunker extends CombatTarget {
  constructor({ clock, target, groundY, obstacles = [], createWeapon = createMachineGun, nextSpawnX, gunner = null, ...rest } = {}) {
    super({ z: -1, ...rest })
    this.target = target
    this.obstacles = obstacles
    this.gunner = gunner
    if (gunner) {
      this.fire = null
      this.projectiles = gunner.bullets
      this.children.push(gunner)
    } else {
      this.fire = new EnemyFire({ owner: this, target, obstacles, createWeapon, clock, groundY })
      this.projectiles = this.fire.projectiles
    }
    this.nextSpawnX = nextSpawnX
    this.controller = null
    this.machine = new StateMachine(this, states, 'idle')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** The gun fires from either side of the bunker, so it can aim anywhere. */
  aimAt(point) {
    if (this.gunner) this.gunner.aimAt(point)
    else this.fire.aimAt(point)
    return true
  }

  get forward() {
    return -1
  }

  get shots() {
    return { straight: { x: 300, y: 0 } }
  }

  die(source) {
    super.die(source)
    this.setState('dead')
  }

  reset() {
    super.reset()
    this.setState('idle')
    this.gunner?.reset()
    this.fire?.reset()
  }

  checkBounds() {
    if (!this.nextSpawnX) return super.checkBounds()
    if (!Number.isFinite(this.width) || this.x + this.width / 2 >= 0) return
    this.x = this.nextSpawnX()
    this.wrapElapsed = 0
    this.reset()
  }

  update(dt) {
    super.update(dt)
    this.controller?.update(dt)
    if (this.gunner) return this.manGun()
    // with nowhere to aim yet it holds fire
    this.fire.update(this.state === 'fire' && this.fire.point !== null)
  }

  /** The gunner lies at the door, in front of the bunker, and fires while the bunker does; he falls with it. */
  manGun() {
    const { gunner } = this
    gunner.x = this.x - this.width * .1
    gunner.y = this.y + this.height / 2
    if (this.dead) gunner.die()
    else gunner.setState(this.state === 'fire' ? 'fire' : 'idle')
  }

  /** A gunner checks his own rounds as he fires them. */
  checkHits() {
    this.fire?.checkHits()
  }
}
