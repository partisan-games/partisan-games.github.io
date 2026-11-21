import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A soldier's rifle: its reach in metres, the seconds between shots, the bullet speed in metres a second, the little
 * of a plane's health one hit takes, and how steep, in radians, a shot must be for the soldier to raise his rifle to
 * the sky. Measured from the earlier pixel soldier at 30.8 px a metre.
 */
export const rifle = { reach: 19.5, reload: 2, speed: 29.21, damage: 3, steep: .6 }
/** A soldier's patrol: his walking pace in metres a second, and how far from his post he goes either way. */
export const patrol = { speed: .97, range: 2.6 }

/**
 * The hit box of each soldier in metres, his health in bullet damage, and the muzzle of his rifle raised to the sky,
 * ahead of his centre and above it; a level rifle fires from his centre.
 */
export const riflemanKinds = {
  soldier: { size: { length: 1.41, height: 1.83, width: .43 }, health: 10, muzzleUp: { ahead: .26, above: 1.06 }, reloadTime: 1.6 },
  assault: { size: { length: 2.21, height: 1.66, width: .43 }, health: 10, muzzleUp: { ahead: .66, above: 1 } },
}

const stand = soldier => {
  soldier.vx = 0
}

/**
 * The soldier stands at ease, or walks his patrol to and fro by his post, or fires where he aims as often as he
 * reloads, or lies fallen. Each lasts until he is set to another.
 */
const states = {
  idle: { enter: stand },
  patrol: {
    enter: soldier => {
      // back towards the post, or either way when standing on it
      const way = Math.sign(soldier.post - soldier.x) || (soldier.random() < .5 ? -1 : 1)
      soldier.face(way)
    },
    update: (soldier, dt) => {
      const step = soldier.forward * patrol.speed * dt
      if (Math.abs(soldier.x + step - soldier.post) > patrol.range) soldier.face(-soldier.forward)
      soldier.vx = soldier.forward * patrol.speed
    },
  },
  fire: {
    enter: stand,
    update: soldier => soldier.shoot(),
  },
  dead: { enter: stand },
}

/**
 * A soldier at his post. He faces right (yaw 0) or left (yaw π) and fires his rifle where he aims; his bullets hit
 * the living ones of `targets`. `clock` is the game clock, so reloading waits in a pause, and he fires only while
 * `canFire()`.
 */
export default class Rifleman extends Body {
  constructor({ kind = riflemanKinds.soldier, clock, targets = [], canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size: kind.size, health: kind.health, ...rest, states: kind.reloadTime ? { ...states, reload: {
      enter: stand,
      update: soldier => {
        if (soldier.stateTime >= soldier.kind.reloadTime) soldier.setState('idle')
      },
    } } : states })
    Object.assign(this, { kind, targets, canFire, random })
    this.post = this.x
    /** The point he aims at, and whether his rifle is raised to the sky for it. */
    this.aimPoint = null
    this.raised = false
    this.reload = new Cooldown({ seconds: rifle.reload, clock })
    // soldiers standing together do not fire together
    this.reload.start(random() * rifle.reload)
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: rifle.damage, max: rifle.damage }, random }))
  }

  /** The way he faces: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  face(way) {
    this.yaw = way < 0 ? Math.PI : 0
  }

  get reach() {
    return rifle.reach
  }

  /** The point ahead and above him for each shot: a level one at a low point, the rifle raised for a high one. */
  get shots() {
    return { straight: { x: 13, y: 1.93 }, up: { x: 6.5, y: 13 } }
  }

  /** Turns to `point` and raises the rifle if it is steep; a point not above him he cannot aim at. */
  aimAt(point) {
    if (point.y <= this.y) return false
    if (point.x !== this.x) this.face(point.x - this.x)
    this.raised = Math.atan2(point.y - this.y, Math.abs(point.x - this.x)) > rifle.steep
    this.aimPoint = { x: point.x, y: point.y }
    return true
  }

  get muzzle() {
    if (!this.raised) return { x: this.x, y: this.y, z: this.z }
    const { ahead, above } = this.kind.muzzleUp
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  /** Fires towards the aimed point, or straight ahead with none, if he has reloaded; returns whether he fired. */
  shoot() {
    if (this.dead || this.state === 'reload' || !this.canFire() || !this.reload.ready) return false
    const from = this.muzzle, aim = this.aimPoint
    const pitch = aim ? Math.atan2(aim.y - from.y, Math.abs(aim.x - from.x)) : 0
    this.bullets.fire(from, this.yaw, pitch, rifle.speed)
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** Bullets already in the air still hit after he falls. */
  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
