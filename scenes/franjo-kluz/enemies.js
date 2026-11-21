import spriteArt from '/core/actor/spriteArt.js'
import { hummelFire } from '/core/actor/actionArt.js'

/**
 * How each enemy on the ground looks: its atlas, and for a vehicle the way its picture faces, and so drives: -1 left.
 * Soldiers face the plane, which comes from the left. Their sizes and health are the kinds of the Rifleman and
 * Vehicle bodies of the same name; soldiers fall to one bullet, the armoured train only to a long burst, and a bomb
 * destroys any of them. None must be destroyed to win.
 */
export const kinds = {
  soldier: { art: spriteArt.rifleman },
  assault: { art: spriteArt.assault },
  truck: { art: spriteArt['opel-blitz'], facing: -1 },
  legionTruck: { art: spriteArt['opel-blitz-legion'], facing: -1 },
  tank: { art: spriteArt.hummel, attack: hummelFire, facing: 1 },
  train: { art: spriteArt.bp42, facing: -1 },
}
