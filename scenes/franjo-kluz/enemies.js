import spriteArt from '/core/actor/spriteArt.js'

/**
 * What stands on the ground along the way to the airfield: soldiers fall to one bullet, trucks to a few, the tank to a
 * short burst and the armoured train only to a long one; a bomb destroys any of them. None must be destroyed to win.
 * Soldiers with a `rifle` fire at the plane. A vehicle's `facing` is the way its picture faces, and so drives: -1 left.
 * Health is in bullet damage (10 to 20 a bullet).
 */
export const kinds = {
  // These are the old single-image dimensions: atlas padding must not enlarge the colliders.
  soldier: { art: spriteArt.rifleman, size: [58, 75], health: 10, vehicle: false, mirrored: true, rifle: true },
  assault: { art: spriteArt.assault, size: [91, 68], health: 10, vehicle: false, mirrored: true, rifle: true },
  truck: { art: spriteArt['opel-blitz'], size: [273, 118], health: 45, vehicle: true, facing: -1 },
  legionTruck: { art: spriteArt['opel-blitz-legion'], size: [287, 118], health: 45, vehicle: true, facing: -1 },
  /** About a second of steady hits, as the owner set it for the tank. */
  tank: { art: spriteArt.hummel, size: [298, 138], health: 150, vehicle: true, facing: 1 },
  train: { art: spriteArt.bp42, size: [505, 198], health: 300, vehicle: true, facing: -1 },
}
