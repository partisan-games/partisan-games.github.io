/** The numbers of the vis game, its waves and its enemy kinds; each block keeps its own in its module. */
export const settings = {
  scrollSpeed: 150, // px per second: the sea, the island and the base
  clouds: 3,
  restTime: 4, // seconds the plane stands on an airfield on the way before it takes off
  engineVolume: .3, // of the game volume, a hum under the guns
  formationGap: 125, // px between planes in a formation, a little more than a fighter's width
  enemies: {
    fighter: {
      scale: .5, hits: 1, points: 100, speed: 190,
      fire: { interval: 2.5, spread: [0] }, // seconds between shots, angles of one shot
    },
    heavy: {
      scale: .5, hits: 5, points: 500, speed: 110,
      fire: { interval: 2, spread: [-.25, 0, .25] },
    },
    boss: {
      scale: .5, hits: 60, points: 5000, speed: 60,
      fire: { interval: 1.2, spread: [-.5, -.25, 0, .25, .5] },
    },
  },
}
