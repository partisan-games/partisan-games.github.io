/** Every number that sets how vis plays, in one place. */
export const settings = {
  scrollSpeed: 150, // px per second: the sea, the island and the base
  clouds: 3,
  landingTime: 3, // seconds from the base appearing to the victory
  player: {
    lives: 3,
    bombs: 3,
    bombRadius: .5, // of the shorter side of the screen, where the bursts go off
    bombHits: 10, // a fighter or a heavy plane goes down, the boss loses a sixth
    bombBursts: 12, // explosions spread over the blast, besides one on every plane it hits
    bombSpread: .4, // seconds over which the bursts go off
    respawnTime: 2.5, // seconds
    shieldTime: 2, // seconds the plane cannot be hit after coming back
    blinkTime: .1, // seconds between solid and faint while it cannot be hit
    loops: 3, // per life
    loop: { duration: 1, grow: .5, ahead: 60 }, // seconds; how much bigger and how many px ahead at the top of the loop
  },
  formationGap: 125, // px between planes in a formation, a little more than a fighter's width
  explosion: { duration: 1, scale: 1.8 }, // seconds, size of the 128 px frame
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
