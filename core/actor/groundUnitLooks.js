import spriteArt from '/core/actor/spriteArt.js'
import { hummelFire, bp42Fire } from '/core/actor/actionArt.js'
import Vehicle from '/core/gameplay/bodies/vehicles/Vehicle.js'
import BP42 from '/core/gameplay/bodies/vehicles/BP42.js'
import Hummel from '/core/gameplay/bodies/vehicles/Hummel.js'

/**
 * How each unit on the ground looks: its atlas, its attack's art, and for a vehicle the way its picture faces: -1 left.
 * Their sizes and health are the kinds of the Rifleman and Vehicle bodies of the same name.
 */
export const groundUnitLooks = {
  soldier: { art: spriteArt.rifleman },
  assault: { art: spriteArt.assault },
  truck: { Body: Vehicle, art: spriteArt['opel-blitz'], facing: -1 },
  legionTruck: { Body: Vehicle, art: spriteArt['opel-blitz-legion'], facing: -1 },
  tank: { Body: Hummel, art: spriteArt.hummel, attack: hummelFire, facing: 1 },
  train: { Body: BP42, art: spriteArt.bp42, attack: bp42Fire, facing: -1 },
}
