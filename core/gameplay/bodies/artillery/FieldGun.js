import Body from '../Body.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Cannonball, { cannonball } from '../projectiles/Cannonball.js'
import { stand } from '../ground.js'
import { box, circle, fromImage, placeShape } from '../../../collision/shapes.js'
import { sweepCircle } from '../../../collision/sweep.js'

/**
 * The force of a shot, at least and at most, in metres a second, and how much holding fire adds to it each second;
 * how fast the barrel rises and sinks, in radians a second, and how far; how far a shot throws the gun back, in
 * metres, and how fast it rolls forward again; under what health it burns. Measured from the earlier pixel cannon at
 * 40 px a metre, where its crew are 1.8 m tall.
 */
export const fieldGun = {
  minForce: 7.5, maxForce: 22.5, chargeRate: 7.5, aimRate: .5, lowest: .0832, highest: .6032, recoil: .125,
  recoilReturn: .5, burnBelow: 20,
}
/** The elevations `aimAt` tries, from the highest down, so the farther the point, the higher the barrel. */
const aimStep = .005

/**
 * The gun in metres from its barrel pivot: the muzzle ahead and above that pivot, the carriage's middle behind
 * and below it, and the wheel, whose bottom stands on the ground.
 * The pictures are drawn at .01875 m a pixel; their transparent edges and the ground under the carriage are no target.
 */
const pixel = .01875
const joint = { x: 258.3251748251748, y: 9.437062937062933 }
export const gunShape = {
  pixel,
  barrel: { image: { width: 274, height: 52 }, pivot: { x: 100, y: 44 }, muzzleAhead: 173 * pixel, muzzleAbove: 8 * pixel },
  carriage: { image: { width: 400, height: 99 }, behind: (joint.x - 200) * pixel, below: (49.5 - joint.y) * pixel },
  wheel: { behind: (joint.x - 220.5) * pixel, below: (64.5 - joint.y) * pixel, radius: 31.5 * pixel },
}
const barrelShapes = fromImage(gunShape.barrel.image, pixel, [
  box(160, 36, 228, 12), // barrel and breech
  box(84.5, 46.5, 169, 9), // cradle
  box(91, 15, 32, 7, Math.atan2(30, 12)), // lever
  box(56, 26, 14, 8), // sight
]).map(shape => ({ ...shape,
  x: shape.x + (gunShape.barrel.image.width / 2 - gunShape.barrel.pivot.x) * pixel,
  y: shape.y + (gunShape.barrel.image.height / 2 - gunShape.barrel.pivot.y) * pixel,
}))
const carriageShapes = fromImage(gunShape.carriage.image, pixel, [
  circle(220.5, 64.5, 31.5), // wheel
  box(122.5, 80.5, 136, 12, -.096), // trail
  box(29.5, 81.5, 7, 13), // spade
])
/** The barrel pivot stands this high above the ground under the wheel. */
const standingHeight = gunShape.wheel.below + gunShape.wheel.radius

/**
 * The gun stands, its crew loads it, or it fires where `aimAt` set it as soon as its last shot is over, or it lies
 * destroyed. Who aims and fires it, and when, is up to the world.
 */
const states = {
  idle: {},
  load: {},
  fire: {
    update: gun => {
      if (gun.hasActiveShot || gun.aimedForce === null) return
      gun.force = gun.aimedForce
      gun.launch()
    },
  },
  dead: {},
}

/**
 * A muzzle-loading field gun, facing right (yaw 0) or left (yaw π), standing on `groundAt(x)`, which may give way
 * under its wheel. Its shots fly with the `wind`, hit the living ones of `targets`, burst on the ground, where
 * `onBlast(x)` digs a crater, and leave play past the sides of `bounds`. It fires only while `canFire()`. Its drawn
 * outline, not a box, takes the hits.
 */
export default class FieldGun extends Body {
  constructor({ targets = [], wind = null, groundAt = () => 0, bounds, onBlast, canFire = () => true,
    random = Math.random, ...rest } = {}) {
    super({ size: { length: 7.5, height: 2.6, width: .75 }, ...rest, states })
    Object.assign(this, { targets, wind, groundAt, canFire })
    this.home = this.x
    this.elevation = .2
    this.force = fieldGun.minForce
    this.aimedForce = null
    this.shells = new ProjectilePool(() => new Cannonball({ wind, groundAt, bounds, onBlast, random }))
    this.y = groundAt(this.wheelX) + standingHeight
    /** The parts the hit shapes turn and flip with, in the frame the pictures were measured in (y down). */
    const gun = this
    this.parts = [
      { shapes: barrelShapes, get x() {
        return gun.x
      }, get y() {
        return gun.y
      }, get angle() {
        return gun.barrelAngle
      },
      get flipX() {
        return -gun.forward
      } },
      { shapes: carriageShapes, get x() {
        return gun.carriage.x
      }, get y() {
        return gun.carriage.y
      }, flipX: -1,
      get scaleX() {
        return gun.forward
      } },
    ]
  }

  /** The way it faces: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  get elevation() {
    return this.barrelElevation
  }

  /** The barrel's angle above level, kept between the lowest and the highest it goes. */
  set elevation(value) {
    this.barrelElevation = Math.max(fieldGun.lowest, Math.min(fieldGun.highest, value))
  }

  /** The barrel's angle from +x. */
  get barrelAngle() {
    return this.forward > 0 ? this.elevation : Math.PI - this.elevation
  }

  get carriage() {
    const { behind, below } = gunShape.carriage
    return { x: this.x - this.forward * behind, y: this.y - below }
  }

  /** Where the wheel stands: a crater there lets the whole gun sink. */
  get wheelX() {
    return this.x - this.forward * gunShape.wheel.behind
  }

  get muzzle() {
    const { muzzleAhead, muzzleAbove } = gunShape.barrel
    const along = { x: Math.cos(this.barrelAngle), y: Math.sin(this.barrelAngle) }
    const down = { x: this.forward * Math.sin(this.elevation), y: -Math.cos(this.elevation) }
    return {
      x: this.x + along.x * muzzleAhead - down.x * muzzleAbove,
      y: this.y + along.y * muzzleAhead - down.y * muzzleAbove,
      z: this.z,
    }
  }

  get burning() {
    return this.health.current <= fieldGun.burnBelow
  }

  get hasActiveShot() {
    return this.shells.projectiles.some(shell => shell.active)
  }

  /** When the step of a round shot of `radius` from `start` to `end` first touches the drawn gun, or null. */
  hitTime(start, end, radius = 0) {
    let first = null
    for (const part of this.parts)
      for (const shape of part.shapes) {
        const time = sweepCircle(start, end, radius, placeShape(shape, part))
        if (time !== null && (first === null || time < first)) first = time
      }
    return first
  }

  /** Fires the charged force along the barrel if it may and its last shot is over, and recoils; returns whether. */
  launch() {
    if (this.dead || !this.canFire() || this.hasActiveShot) return false
    this.shells.fire(this.muzzle, this.forward > 0 ? 0 : Math.PI, this.elevation, this.force)
    this.shotsFired++
    this.x -= fieldGun.recoil * this.forward
    this.force = fieldGun.minForce
    return true
  }

  /** Builds up the force of the next shot while fire is held. */
  charge(dt) {
    this.force = Math.min(fieldGun.maxForce, this.force + fieldGun.chargeRate * dt)
  }

  /** Whether fire has been held, so letting it go fires. */
  get charged() {
    return this.force > fieldGun.minForce
  }

  /** Raises the barrel for `way` 1, or lowers it for -1. */
  turnBarrel(way, dt) {
    this.elevation += way * fieldGun.aimRate * dt
  }

  /** As far as the strongest shot carries over level ground, with the barrel highest and no wind. */
  get reach() {
    return fieldGun.maxForce ** 2 * Math.sin(2 * fieldGun.highest) / cannonball.gravity
  }

  /** Points on the ground ahead: a near one takes a low barrel, a far one a raised barrel. */
  get shots() {
    return { straight: { x: 17.5, y: -standingHeight }, up: { x: 25, y: -standingHeight } }
  }

  /**
   * The force that throws a shot from the muzzle to `point` at `elevation`, which the barrel is set to, with the
   * wind, or null when no throw at it gets there.
   */
  forceFor(point, elevation = this.elevation) {
    const { x, y } = this.muzzle
    const distance = Math.abs(point.x - x)
    const drop = y - point.y
    const acceleration = this.forward * (this.wind?.acceleration || 0)
    const timeSquared = 2 * (distance * Math.tan(elevation) + drop) / (cannonball.gravity + acceleration * Math.tan(elevation))
    return timeSquared > 0
      ? (distance - acceleration * timeSquared / 2) / (Math.cos(elevation) * Math.sqrt(timeSquared))
      : null
  }

  /**
   * Sets the barrel and the force of the next shot for `point`, at the highest elevation whose force the gun has, and
   * gives whether the point is ahead and within reach. An unreachable point leaves the aim as it was.
   */
  aimAt(point) {
    if (Math.sign(point.x - this.x) !== this.forward) return false
    const { elevation } = this
    const steps = Math.ceil((fieldGun.highest - fieldGun.lowest) / aimStep)
    for (let i = 0; i <= steps; i++) {
      const tried = Math.max(fieldGun.lowest, fieldGun.highest - i * aimStep)
      this.elevation = tried
      const force = this.forceFor(point)
      if (force !== null && force >= fieldGun.minForce && force <= fieldGun.maxForce) {
        this.aimedForce = force
        return true
      }
    }
    this.elevation = elevation
    return false
  }

  /** It stands on the ground under its wheel, rolls back to its place after a shot, and its shots fly on. */
  update(dt) {
    super.update(dt)
    stand(this, dt, { footX: this.wheelX, height: standingHeight })
    const recoil = this.home - this.x
    this.x += Math.sign(recoil) * Math.min(Math.abs(recoil), fieldGun.recoilReturn * dt)
    this.shells.update(dt, this.targets)
  }
}
