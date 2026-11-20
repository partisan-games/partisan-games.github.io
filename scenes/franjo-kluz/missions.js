/**
 * The first mission's raids: where the view is when each raider comes, in world x, its kind, 'fighter' or
 * 'diveBomber', and whether it comes from behind.
 */
const firstRaids = [
  { x: 4000, kind: 'fighter', fromBehind: false },
  { x: 8000, kind: 'fighter', fromBehind: true },
  { x: 11_500, kind: 'fighter', fromBehind: false },
  { x: 14_000, kind: 'fighter', fromBehind: false },
  { x: 16_500, kind: 'fighter', fromBehind: true },
  { x: 19_500, kind: 'fighter', fromBehind: false },
]

/** World x of every enemy on the ground, in the order the plane meets them; `flak` is an anti-aircraft gun. */
const firstEnemies = [
  { kind: 'soldier', x: 2200 }, { kind: 'assault', x: 2320 }, { kind: 'soldier', x: 2460 },
  { kind: 'truck', x: 3600 }, { kind: 'legionTruck', x: 3900 }, { kind: 'truck', x: 4200 },
  { kind: 'flak', x: 5200 },
  { kind: 'soldier', x: 6400 }, { kind: 'assault', x: 6500 },
  { kind: 'flak', x: 7600 },
  { kind: 'tank', x: 8200 },
  { kind: 'train', x: 9000 },
  { kind: 'soldier', x: 10_300 }, { kind: 'soldier', x: 10_420 }, { kind: 'assault', x: 10_560 },
  { kind: 'flak', x: 11_800 },
  { kind: 'truck', x: 13_000 }, { kind: 'truck', x: 13_300 }, { kind: 'legionTruck', x: 13_600 }, { kind: 'truck', x: 13_900 },
  { kind: 'flak', x: 15_200 }, { kind: 'flak', x: 15_700 },
  { kind: 'assault', x: 17_000 }, { kind: 'soldier', x: 17_120 },
  { kind: 'train', x: 18_600 },
  { kind: 'tank', x: 19_600 },
  { kind: 'flak', x: 20_400 },
  { kind: 'soldier', x: 21_600 }, { kind: 'assault', x: 21_720 }, { kind: 'soldier', x: 21_860 },
]

/**
 * The second mission takes off from the airfield the first one landed on and attacks what moves on the roads; only
 * fire from the ground, no fighters.
 */
const secondEnemies = [
  { kind: 'truck', x: 2400 }, { kind: 'truck', x: 2700 }, { kind: 'legionTruck', x: 3000 },
  { kind: 'flak', x: 3500 },
  { kind: 'soldier', x: 5200 }, { kind: 'assault', x: 5320 },
  { kind: 'tank', x: 6200 },
  { kind: 'flak', x: 7000 },
  { kind: 'train', x: 8800 },
  { kind: 'flak', x: 10_500 },
  { kind: 'soldier', x: 12_000 }, { kind: 'soldier', x: 12_120 }, { kind: 'assault', x: 12_260 },
  { kind: 'legionTruck', x: 13_000 }, { kind: 'truck', x: 13_300 },
  { kind: 'flak', x: 14_000 },
]

/**
 * The third mission, after the German air raid on the partisan airfield in July 1942: the plane stands on the runway
 * under the siren. Two Ju 87s come at once, from farther out, so that the first bomb falls some 5 to 8 seconds after
 * the start on screens 1024 to 1920 px wide: `distance` is how far outside the view a raider enters, in pixels.
 */
const thirdRaids = [
  { x: 0, kind: 'diveBomber', fromBehind: false, distance: 1300 },
  { x: 0, kind: 'diveBomber', fromBehind: false, distance: 1600 },
  { x: 3000, kind: 'fighter', fromBehind: true },
  { x: 5000, kind: 'diveBomber', fromBehind: false },
  { x: 7000, kind: 'fighter', fromBehind: false },
  { x: 9000, kind: 'diveBomber', fromBehind: false },
  { x: 9000, kind: 'diveBomber', fromBehind: false, distance: 500 },
]

/** Few enemies on the ground, far from the airfield: the fight is in the air. */
const thirdEnemies = [
  { kind: 'truck', x: 6000 }, { kind: 'truck', x: 6300 },
  { kind: 'flak', x: 8000 },
]

/**
 * The missions in the order they are flown; winning one shows its `outro` and goes on to the next. Each gives the
 * task shown at its start, whether the plane takes off from an airfield, whether it flies in NDH markings that fool
 * the enemy until half way, whether it can crash into the ruin, the world x of the airfield to land on, the enemies on
 * the ground and the raids. In an `airRaid` the siren wails from the start, a raider not shot down comes back after it
 * leaves the view, and landing wins only once none is left.
 */
export const missions = [
  {
    intro: 'Break through the enemy and join the partisans!',
    outro: 'You joined the partisans! Your plane gets the red star.',
    takeoff: false,
    disguised: true,
    solidRuin: true,
    airfieldX: 24_000,
    enemies: firstEnemies,
    raids: firstRaids,
    airRaid: false,
  },
  {
    intro: 'Destroy the enemy and land on the airfield!',
    outro: 'Stukas are coming for the airfield! Sirens wail.',
    takeoff: true,
    disguised: false,
    solidRuin: true,
    airfieldX: 16_000,
    enemies: secondEnemies,
    raids: [],
    airRaid: false,
  },
  {
    intro: 'Air raid! Take off before the Stukas bomb you, shoot them all down and land!',
    takeoff: true,
    disguised: false,
    solidRuin: false,
    airfieldX: 14_000,
    enemies: thirdEnemies,
    raids: thirdRaids,
    airRaid: true,
  },
]
