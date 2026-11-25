// Cell measurements are reproduced by scripts/prepare-cetnik-art.py.
const width = 232
const height = 164
const gutter = 4
const anchor = { x: 112, y: 154 }
const standingPixels = 144

function sheet(src, muzzle, stride, attack) {
  return { src, width, height, gutter, anchor, standingPixels, muzzle, clips: {
    idle: { row: 0, ms: [320, 280, 320, 280], loop: true },
    move: { row: 1, ms: [stride, stride, stride, stride], loop: true },
    attack: { row: 2, ...attack },
    dead: { row: 3, ms: [100, 140, 160, 200] },
  } }
}

// The five reports in rafal.mp3 start about 110 ms apart.
const roundsPerRecording = 5
const recordings = 3
const burst = Array.from({ length: roundsPerRecording * recordings }, () => [1, 2]).flat()
const gunnerAttack = {
  frameColumns: [0, ...burst, 3],
  ms: [140, ...burst.map(() => 55), 160],
  soundFrames: Array.from({ length: recordings }, (_, index) => 1 + index * roundsPerRecording * 2),
}

export const sheets = {
  strelac: sheet('game-ready/vojnici/cetnik-strelac.webp', [178, 44], 135, { ms: [130, 70, 120, 140] }),
  jurisnik: sheet('game-ready/vojnici/cetnik-jurisnik.webp', [199, 48], 95, { ms: [110, 65, 100, 140] }),
  mitraljezac: sheet('game-ready/vojnici/cetnik-mitraljezac.webp', [212, 40], 160, gunnerAttack),
}
