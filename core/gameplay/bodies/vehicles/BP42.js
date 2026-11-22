import CannonVehicle from './CannonVehicle.js'
import { vehicleKinds } from './Vehicle.js'

const kind = vehicleKinds.train
const metresPerPixel = Math.min(kind.size.length / 558, kind.size.height / 211)
// The original hull is centred one pixel to the right of its foot anchor. Barrel tip is 277 px left of that anchor.
export const bp42 = { fireTime: .8, ahead: 278 * metresPerPixel, aboveGround: 175 * metresPerPixel }

export default class BP42 extends CannonVehicle {
  constructor(options = {}) {
    super({ ...options, kind, cannon: bp42 })
  }
}
