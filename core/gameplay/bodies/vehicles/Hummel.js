import CannonVehicle from './CannonVehicle.js'
import { vehicleKinds } from './Vehicle.js'

export const hummelKind = vehicleKinds.tank
const metresPerPixel = Math.min(hummelKind.size.length / 298, hummelKind.size.height / 138)
export const hummel = { fireTime: .8, ahead: 143 * metresPerPixel, aboveGround: 100 * metresPerPixel }

export default class Hummel extends CannonVehicle {
  constructor(options = {}) {
    super({ ...options, kind: hummelKind, cannon: hummel })
  }
}
