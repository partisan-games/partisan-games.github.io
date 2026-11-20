/** The first mission. Where the view is when each fighter comes, in world x, and whether it comes from behind. */
const firstFighters = [
  { x: 4000, fromBehind: false },
  { x: 8000, fromBehind: true },
  { x: 11_500, fromBehind: false },
  { x: 14_000, fromBehind: false },
  { x: 16_500, fromBehind: true },
  { x: 19_500, fromBehind: false },
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
 * The missions in the order they are flown; winning one shows its `outro` and goes on to the next. Each gives the
 * task shown at its start, whether the plane takes off from an airfield, whether it flies in NDH markings that fool
 * the enemy until half way, the world x of the airfield to land on, the enemies on the ground and the fighters.
 */
export const missions = [
  {
    intro: 'Break through the enemy and join the partisans!',
    outro: 'You joined the partisans! Your plane gets the red star.',
    takeoff: false,
    disguised: true,
    airfieldX: 24_000,
    enemies: firstEnemies,
    fighterPasses: firstFighters,
  },
  {
    intro: 'Destroy the enemy and land on the airfield!',
    takeoff: true,
    disguised: false,
    airfieldX: 16_000,
    enemies: secondEnemies,
    fighterPasses: [],
  },
]
