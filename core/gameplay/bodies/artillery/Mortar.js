import ArtilleryPiece from './ArtilleryPiece.js'
import { cannonball } from '../projectiles/Cannonball.js'
import { stand } from '../ground.js'
import { box, fromImage } from '../../../collision/shapes.js'

/**
 * The settings of an `ArtilleryPiece` for an 81 mm mortar, which aims only steeply, from 45° to 85°: a higher tube
 * throws nearer. Its bombs fall twice as hard as a field gun's balls, so their high arc lasts longer than a ball's
 * low one, yet not so long that the duel drags; the elevations the computer opens with.
 */
export const mortar = {
  minForce: 9, maxForce: 22, chargeRate: 6, aimRate: .5, lowest: Math.PI / 4, highest: 85 * Math.PI / 180,
  burnBelow: 20, shellFall: cannonball.fall * 2, aimElevations: [.9, 1, 1.1, 1.2, 1.3],
}

/**
 * The parts of the mortar as their pictures are drawn, pointing right at .0125 m a pixel, in their pixels: the tube
 * from its foot to its mouth, the bipod from its feet to the top that bears the tube, and the base plate from its
 * bottom middle to the seat of the tube's foot.
 */
const pixel = .0125
export const mortarShape = {
  pixel,
  tube: { image: { width: 104, height: 28 }, foot: { x: 6, y: 14 }, mouth: { x: 98, y: 14 } },
  bipod: { image: { width: 58, height: 56 }, feet: { x: 28, y: 54 }, top: { x: 28, y: 6 } },
  plate: { image: { width: 74, height: 26 }, bottom: { x: 36, y: 26 }, seat: { x: 36, y: 12 } },
}
const { tube, bipod, plate } = mortarShape
const tubeLength = (tube.mouth.x - tube.foot.x) * pixel
/** How high the tube's foot rests above the ground, and how high the bipod bears the tube. */
const seatHeight = (plate.bottom.y - plate.seat.y) * pixel
const bipodHeight = (bipod.feet.y - bipod.top.y) * pixel

/** The shapes that take hits, each about the point it turns with: the tube about its foot, the plate about its seat. */
const tubeShapes = fromImage(tube.image, pixel, [box(52, 14, 92, 14)]).map(shape => ({ ...shape,
  x: shape.x + (tube.image.width / 2 - tube.foot.x) * pixel,
  y: shape.y + (tube.image.height / 2 - tube.foot.y) * pixel,
}))
const plateShapes = fromImage(plate.image, pixel, [box(37, 19, 74, 14)]).map(shape => ({ ...shape,
  x: shape.x + (plate.image.width / 2 - plate.seat.x) * pixel,
  y: shape.y + (plate.image.height / 2 - plate.seat.y) * pixel,
}))

/**
 * An 81 mm mortar standing on `groundAt(x)`, which may give way under its base plate. Its `x` and `y` are the foot of
 * the tube; its drawn tube and plate, not a box, take the hits.
 */
export default class Mortar extends ArtilleryPiece {
  constructor({ groundAt = () => 0, ...rest } = {}) {
    super({ size: { length: 1.6, height: 1.4, width: .6 }, settings: mortar, groundAt, ...rest })
    this.elevation = 1.1
    this.y = groundAt(this.x) + seatHeight
    /** The parts the hit shapes turn and flip with, in the frame the pictures were measured in (y down). */
    const piece = this
    this.parts = [
      { shapes: tubeShapes, get x() {
        return piece.x
      }, get y() {
        return piece.y
      }, get angle() {
        return piece.barrelAngle
      }, get flipX() {
        return -piece.forward
      } },
      { shapes: plateShapes, get x() {
        return piece.x
      }, get y() {
        return piece.y
      }, flipX: -1, get scaleX() {
        return piece.forward
      } },
    ]
  }

  get muzzle() {
    return { x: this.x + Math.cos(this.barrelAngle) * tubeLength, y: this.y + Math.sin(this.barrelAngle) * tubeLength, z: this.z }
  }

  /** The ground under the plate. */
  get ground() {
    return this.y - seatHeight
  }

  /** Where the bipod's top bears the tube: it stands under that point, as the tube rises and sinks. */
  get bipodTop() {
    const along = (bipodHeight - seatHeight) / Math.sin(this.elevation)
    return { x: this.x + Math.cos(this.barrelAngle) * along, y: this.ground + bipodHeight }
  }

  /** Points on the ground ahead: the steeper tube drops a bomb near, the lower one throws it far. */
  get shots() {
    return { up: { x: 12, y: -seatHeight }, straight: { x: 22, y: -seatHeight } }
  }

  /** It stands on the ground under its base plate; its shots fly on. */
  update(dt) {
    super.update(dt)
    stand(this, dt, { height: seatHeight })
  }
}
