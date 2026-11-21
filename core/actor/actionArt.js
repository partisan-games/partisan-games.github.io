/** Runtime measurements of the prepared clips linked in docs/ART.md; sources keep the full provenance. */
export const partisanMovement = {
  src: 'armies/game-ready/vojnici/partizanski-strelac-movement-sprites.png',
  width: 160, height: 160, anchor: { x: 80, y: 140.8 },
  clips: {
    standUp: { row: 0, ms: [160, 140, 140, 160] },
    walk: { row: 1, ms: Array(8).fill(100), loop: true },
    death: { row: 2, ms: [100, 100, 120, 120, 140, 180] },
    deathStanding: { row: 3, ms: [100, 100, 120, 120, 140, 180] },
  },
}

const crewDeath = src => ({
  src, width: 160, height: 128, anchor: { x: 80, y: 123.52 },
  clips: { death: { ms: [100, 120, 140, 140, 160, 180] } },
})
export const partisanCrewDeath = crewDeath('armies/game-ready/artiljerija/partizanska-posada-death-sprites.png')
export const italianCrewDeath = crewDeath('armies/game-ready/artiljerija/italijanska-posada-death-sprites.png')

export const riflemanReload = {
  src: 'armies/game-ready/vojnici/nemacki-strelac-reload-sprites.png',
  width: 128, height: 128, anchor: { x: 64, y: 120 },
  clips: { reload: { ms: [160, 160, 180, 220, 220, 220, 220, 220] } },
}

export const hummelFire = {
  src: 'armies/game-ready/tenkovi/hummel-fire-sprites.png',
  width: 384, height: 176, anchor: { x: 192, y: 156 },
  clips: { fire: { ms: [40, 60, 100, 140, 180, 280] } },
}
