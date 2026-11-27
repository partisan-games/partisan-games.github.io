import ArtilleryPiece from './ArtilleryPiece.js'
import { cannonball } from '../projectiles/Cannonball.js'
import { stand } from '../ground.js'
import { box, circle, fromImage } from '../../../collision/shapes.js'

/**
 * The settings of an `ArtilleryPiece`, and how far a shot throws the gun back, in metres, and how fast it rolls
 * forward again; the elevations the computer opens with. Measured from the earlier pixel cannon at 40 px a metre,
 * where its crew are 1.8 m tall.
 */
export const fieldGun = {
  minForce: 7.5, maxForce: 22.5, chargeRate: 7.5, aimRate: .5, lowest: .0832, highest: .6032, recoil: .125,
  recoilReturn: .5, burnBelow: 20, shellFall: cannonball.fall, aimElevations: [.15, .22, .3, .4, .5],
}

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
 * A muzzle-loading field gun standing on `groundAt(x)`, which may give way under its wheel; a shot throws it back. Its
 * drawn outline, not a box, takes the hits.
 */
export default class FieldGun extends ArtilleryPiece {
  constructor({ groundAt = () => 0, ...rest } = {}) {
    super({ size: { length: 7.5, height: 2.6, width: .75 }, settings: fieldGun, groundAt, ...rest })
    this.home = this.x
    this.elevation = .2
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

  /** Fires as any piece does, and recoils. */
  launch() {
    if (!super.launch()) return false
    this.x -= fieldGun.recoil * this.forward
    return true
  }

  /** As far as the strongest shot carries over level ground, with the barrel highest and no wind. */
  get reach() {
    return fieldGun.maxForce ** 2 * Math.sin(2 * fieldGun.highest) / this.ballPull
  }

  /** Points on the ground ahead: a near one takes a low barrel, a far one a raised barrel. */
  get shots() {
    return { straight: { x: 17.5, y: -standingHeight }, up: { x: 25, y: -standingHeight } }
  }

  /** It stands on the ground under its wheel and rolls back to its place after a shot; its shots fly on. */
  update(dt) {
    super.update(dt)
    stand(this, dt, { footX: this.wheelX, height: standingHeight })
    const recoil = this.home - this.x
    this.x += Math.sign(recoil) * Math.min(Math.abs(recoil), fieldGun.recoilReturn * dt)
  }
}
