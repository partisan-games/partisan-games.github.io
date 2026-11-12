/** Every number that sets how vis plays, in one place. */
export const settings = {
  scrollSpeed: 150, // px per second: the sea, the island and the base
  clouds: 3,
  landingTime: 3, // seconds from the base appearing to the victory
  player: {
    lives: 3,
    bombs: 2,
    bombRadius: .5, // of the shorter side of the screen
    bombHits: 10, // a fighter or a heavy plane goes down, the boss loses a sixth
    respawnTime: 2.5, // seconds
  },
  formationGap: 125, // px between planes in a formation, a little more than a fighter's width
  fallTime: 2, // seconds a shot down plane falls before it is gone
  enemyBulletSpeed: 350, // px per second
  enemies: {
    fighter: {
      images: ['armies/nemci/avioni/avion-odozgo-01.png', 'armies/nemci/avioni/avion-odozgo-03.png', 'armies/nemci/avioni/avion-odozgo-05.png'],
      scale: .45, hits: 1, points: 100, speed: 190,
      fire: { interval: 2.5, spread: [0] }, // seconds between shots, angles of one shot
    },
    heavy: {
      images: ['armies/nemci/avioni/Reggiane-Re-2005.png'],
      scale: .8, hits: 5, points: 500, speed: 110,
      fire: { interval: 2, spread: [-.25, 0, .25] },
    },
    boss: {
      images: ['armies/nemci/avioni/avion-odozgo-02.png'],
      scale: 1.6, hits: 60, points: 5000, speed: 60,
      fire: { interval: 1.2, spread: [-.5, -.25, 0, .25, .5] },
      timeLimit: 35, // seconds before it flies away
    },
  },
}
