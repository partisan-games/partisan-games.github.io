// Finished side-view sprites face left; display width is independent of source resolution.
export const groundEnemyArt = {
  germanTank: {
    src: 'armies/game-ready/tenkovi/nemacki-tenk-bez-cevi-pixel.png', width: 121,
    barrel: {
      src: 'armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png',
      width: 121 * 182 / 327, height: 121 * 26 / 327,
      anchor: { x: 112 / 327 - .5, y: 33 / 137 - .5 },
      sourceRect: [0, 0, 182, 26],
    },
  },
  tank: {
    src: 'armies/game-ready/tenkovi/somua-s35-body-readable.png', width: 151,
    barrel: {
      src: 'armies/game-ready/tenkovi/somua-s35-barrel.png', width: 20, height: 3.2,
      anchor: { x: -.307, y: -.217 },
      sourceRect: [126, 203, 1923, 309],
    },
  },
  truck: { src: 'armies/game-ready/kamioni/opel-blitz.svg', width: 137 },
  antiTankGun: {
    src: 'armies/game-ready/artiljerija/pak38-postolje.png', width: 117,
    barrel: {
      src: 'armies/game-ready/artiljerija/pak38-cev.png', width: 117 * 90 / 233, height: 117 * 8 / 233,
      anchor: { x: 90 / 233 - .5, y: 11 / 51 - .5 },
      sourceRect: [0, 0, 90, 8],
    },
  },
}

export const enemyAircraftArt = {
  diveBomber: { src: 'armies/game-ready/avioni/ju87.svg', width: 200 },
  fighter: { src: 'armies/game-ready/avioni/bf109.svg', width: 182 },
}
