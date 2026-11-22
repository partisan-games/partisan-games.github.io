import spriteArt from '/core/actor/spriteArt.js'
import { hummelFire } from '/core/actor/actionArt.js'

/**
 * How each unit on the ground looks: its atlas, its attack's art, and for a vehicle the way its picture faces: -1 left.
 * Their sizes and health are the kinds of the Rifleman and Vehicle bodies of the same name.
 */
export const groundUnitLooks = {
  soldier: { art: spriteArt.rifleman },
  assault: { art: spriteArt.assault },
  truck: { art: spriteArt['opel-blitz'], facing: -1 },
  legionTruck: { art: spriteArt['opel-blitz-legion'], facing: -1 },
  tank: { art: spriteArt.hummel, attack: hummelFire, facing: 1 },
  train: { art: spriteArt.bp42, facing: -1 },
}
