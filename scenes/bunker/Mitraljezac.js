import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Projectile from '/core/actor/projectiles/Projectile.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { origins } from '/core/constants.js'

/**
 * The machine gun: the seconds between rounds, the rounds in one burst, the seconds of rest after a burst and before
 * the first one, and the round speed in pixels per second.
 */
export const machineGun = { reload: .1, burst: 5, pause: 3, speed: 600 }

/** The gunner holds fire, or fires bursts where he aims as often as his gun allows, until set to another. */
const states = {
  idle: {},
  fire: {
    update: gunner => {
      if (!gunner.burst.ready || !gunner.weapon.tryFire(gunner.position, gunner.aimAngle)) return
      if (++gunner.fired < machineGun.burst) return
      gunner.fired = 0
      gunner.burst.start()
    },
  },
}

/** A machine gunner lying behind his gun, seen from above, who turns it anywhere. */
export default class Mitraljezac extends GameObject2D {
  /** `targets` are what his rounds can hit. */
  constructor({ x, y, targets = [], session }) {
    super('armies/nemci/mitraljezac-01.png', { x, y, z: -1, origin: origins.bottomRight })
    this.session = session
    this.targets = targets
    /** Where the gun points; the picture points it left. */
    this.aimAngle = Math.PI
    this.bullets = new ProjectilePool({ owner: this, create: () => new Projectile({ scale: .4 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: machineGun.reload, clock: session.clock }),
      barrels: [{ y: -10 }],
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, machineGun.speed),
    })
    this.burst = new Cooldown({ seconds: machineGun.pause, clock: session.clock })
    this.burst.start()
    /** The rounds of the burst fired so far. */
    this.fired = 0
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

  /** The gun turns all around, so each shot is a point ahead of him, level or high, in pixels. */
  get shots() {
    return { straight: { x: 400, y: 0 }, up: { x: 200, y: -400 } }
  }

  /** His rounds fly across the whole field. */
  get reach() {
    return Infinity
  }

  /** The way the gun points: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.aimAngle) < 0 ? -1 : 1
  }

  /** Turns the gun to `point`, which is always within his turn. */
  aimAt(point) {
    this.aimAngle = this.angleTo(point)
    this.angle = this.aimAngle + Math.PI
    return true
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running' || this.dead) return
    this.machine.update(dt)
    this.bullets.checkHits(this.targets)
  }
}
