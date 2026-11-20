import vehicleArt from '/core/actor/vehicleArt.js'

// Finished side-view sprites face left; display width is independent of source resolution, and the height keeps the
// picture's proportions, so the size is known before the picture loads.
export const groundEnemyArt = {
  germanTank: {
    src: vehicleArt.germanTank.src, sprite: vehicleArt.germanTank, width: 121, height: 121 / 327 * 137,
    barrel: {
      src: 'armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png',
      width: 121 * 182 / 327, height: 121 * 26 / 327,
      anchor: { x: 112 / 327 - .5, y: 33 / 137 - .5 },
      sourceRect: [0, 0, 182, 26],
    },
  },
  tank: {
    src: vehicleArt.somuaS35.src, sprite: vehicleArt.somuaS35, width: 151, height: 151 / 1895 * 830,
    barrel: {
      src: 'armies/game-ready/tenkovi/somua-s35-barrel.png', width: 20, height: 3.2,
      anchor: { x: -.307, y: -.217 },
      sourceRect: [126, 203, 1923, 309],
    },
  },
  truck: { src: vehicleArt.opelBlitz.src, sprite: vehicleArt.opelBlitz, width: vehicleArt.opelBlitz.size[0], height: vehicleArt.opelBlitz.size[1] },
  antiTankGun: {
    src: 'armies/game-ready/artiljerija/pak38-postolje.png', width: 117, height: 117 / 233 * 51,
    barrel: {
      src: 'armies/game-ready/artiljerija/pak38-cev.png', width: 117 * 90 / 233, height: 117 * 8 / 233,
      anchor: { x: 90 / 233 - .5, y: 11 / 51 - .5 },
      sourceRect: [0, 0, 90, 8],
    },
  },
}

export const enemyAircraftArt = {
  diveBomber: { src: 'armies/game-ready/avioni/ju87.svg', width: 200, height: 74 },
  fighter: { src: 'armies/game-ready/avioni/bf109.svg', width: 182, height: 48 },
}
