/** Runtime measurements of the prepared clips linked in docs/ART.md; sources keep the full provenance. */
export const partisanMovement = {
  src: 'game-ready/vojnici/partizanski-strelac-movement-sprites.webp',
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
export const partisanCrewDeath = crewDeath('game-ready/artiljerija/partizanska-posada-death-sprites.webp')
export const italianCrewDeath = crewDeath('game-ready/artiljerija/italijanska-posada-death-sprites.webp')

export const riflemanReload = {
  src: 'game-ready/vojnici/nemacki-strelac-reload-sprites.webp',
  width: 128, height: 128, anchor: { x: 64, y: 120 },
  clips: { reload: { ms: [160, 160, 180, 220, 220, 220, 220, 220] } },
}

export const hummelFire = {
  muzzle: { x: 335, y: 56 },
  src: 'game-ready/tenkovi/hummel-fire-sprites.webp',
  width: 384, height: 176, anchor: { x: 192, y: 156 },
  clips: { fire: { ms: [40, 60, 100, 140, 180, 280] } },
}

export const bp42Fire = {
  src: 'game-ready/vozovi/bp42-fire-sprites.webp',
  width: 704, height: 256, anchor: { x: 352, y: 232 },
  clips: { fire: { ms: [60, 80, 100, 140, 180, 240] } },
  effect: {
    src: 'game-ready/efekti/plamen-pucnja-sprites.webp',
    width: 48, height: 48, anchor: { x: 12, y: 24 }, scale: 1.25,
    clips: { fire: { ms: [40, 60, 100, 140] } },
    muzzleX: [75, 81, 80, 78, 76, 75], smokeStep: { x: -5, y: -4 },
  },
}
