import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import geometry from '../../reinforcementGeometry.js'

/**
 * Each kind of machine-gun carrier: its hit box with its crew, in metres, sized from its picture; its health in bullet
 * damage; how fast it drives, in metres a second; how far it fires, in metres; and its gun: seconds between rounds, rounds in a burst, seconds of
 * rest after a burst and before the first, the round speed in metres a second, the little of a tank's health a round
 * takes, and where it fires from, ahead of the middle and above it. The half-track is stronger and slower than the
 * motorcycle, and fires longer bursts; the armoured car's 20 mm cannon fires short, hard bursts.
 */
export const gunCarrierKinds = {
  motorcycle: {
    size: { length: 3.56, height: 2.1, width: 1.7 }, health: 30, speed: 5.5, reach: 25,
    gun: { reload: .12, burst: 6, pause: 2.5, firstShot: 1, speed: 35, damage: 2, ...geometry.motorcycle },
  },
  halftrack: {
    size: { length: 5.8, height: 2.2, width: 2.1 }, health: 90, speed: 3.6, reach: 28,
    gun: { reload: .1, burst: 10, pause: 2.8, firstShot: 1.2, speed: 36, damage: 2, ...geometry.sdkfz251 },
  },
  armoredCar: {
    size: { length: 4.8, height: 2, width: 1.95 }, health: 60, speed: 4.8, reach: 30,
    gun: { reload: .25, burst: 4, pause: 2.2, firstShot: 1.4, speed: 40, damage: 4, ...geometry.sdkfz222 },
  },
}

const stand = body => {
  body.vx = 0
}
const drive = body => {
  body.vx = body.forward * body.kind.speed
}

/** It stands, drives the way it faces, drives firing its gun where it aims, or lies wrecked where it stopped. */
const states = {
  idle: { enter: stand },
  move: { update: drive },
  attack: {
    update: body => {
      drive(body)
      body.shoot()
    },
  },
  dead: { enter: stand },
}

/**
 * A vehicle of its `kind` with a machine gun, a motorcycle with its sidecar gunner or a half-track, facing right (yaw 0)
 * or left (yaw π); its gun fires ahead, up or down to where it aims. Its rounds hit the living ones of `targets`.
 * `clock` is the game clock, and it fires only while `canFire()`.
 */
export default class GunCarrier extends Body {
  constructor({ kind = gunCarrierKinds.motorcycle, clock, targets = [], canFire = () => true, random = Math.random, view = null,
    ...rest } = {}) {
    super({ size: kind.size, health: kind.health, ...rest, states })
    Object.assign(this, { kind, targets, canFire })
    const { gun } = kind
    this.aimPoint = null
    this.reload = new Cooldown({ seconds: gun.reload, clock })
    this.pause = new Cooldown({ seconds: gun.pause, clock })
    this.pause.start(gun.firstShot)
    this.burstFired = 0
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: gun.damage, max: gun.damage }, random }))
  }

  /** The way it faces and drives: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  get muzzle() {
    const { gun } = this.kind
    let { ahead, above } = gun.muzzle ?? gun.pivot
    if (gun.barrel) {
      const angle = this.gunPitch
      ahead += gun.barrel.ahead * Math.cos(angle) - gun.barrel.above * Math.sin(angle)
      above += gun.barrel.ahead * Math.sin(angle) + gun.barrel.above * Math.cos(angle)
    }
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  get gunPitch() {
    const { pivot, barrel } = this.kind.gun
    if (!pivot || !this.aimPoint) return 0
    return Math.atan2(this.aimPoint.y - this.y - pivot.above,
      this.forward * (this.aimPoint.x - this.x) - pivot.ahead) - Math.atan2(barrel.above, barrel.ahead)
  }

  get reach() {
    return this.kind.reach
  }

  get shots() {
    return { straight: { x: 15, y: 0 } }
  }

  /** Its gun fires only ahead of it; it aims there. */
  aimAt(point) {
    const ahead = this.forward * (point.x - this.muzzle.x) > 0
    if (ahead) this.aimPoint = { x: point.x, y: point.y }
    return ahead
  }

  /** Fires a round of the burst along its aim if it may and has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.aimPoint || !this.canFire() || !this.reload.ready || !this.pause.ready) return false
    const { muzzle, aimPoint } = this
    const pitch = Math.atan2(aimPoint.y - muzzle.y, Math.abs(aimPoint.x - muzzle.x))
    this.bullets.fire(muzzle, this.yaw, pitch, this.kind.gun.speed)
    this.shotsFired++
    this.reload.start()
    if (++this.burstFired < this.kind.gun.burst) return true
    this.burstFired = 0
    this.pause.start()
    return true
  }

  /** Rounds already in the air still hit after it is wrecked. */
  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
