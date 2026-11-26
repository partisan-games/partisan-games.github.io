const flightStart = 340
export const wind = 1.5
export const reliefAt = 4 * 60

// Each pass describes the centre of the drop before wind carries the canopies west.
export const waves = [
  { start: 0, height: 83, zone: 132, fireLimit: 4, rise: .14, burst: 1.35, passes: [
    { at: 0, x: 53, z: -10, side: -1 },
    { at: 12, x: 39, z: 22, side: 1 },
    { at: 25, x: 65, z: -26, side: -1 },
    { at: 41, x: 47, z: 16, side: 1 },
  ] },
  { start: 80, height: 68, zone: 68, fireLimit: 6, rise: .21, burst: 1.5, passes: [
    { at: 0, x: -37, z: -24, side: -1 },
    { at: 8, x: -33, z: 25, side: 1 },
    { at: 24, x: -34, z: -28, side: -1 },
    { at: 38, x: -35, z: 28, side: 1 },
  ] },
  { start: 153, height: 65, zone: 76, fireLimit: 8, rise: .26, burst: 1.65, passes: [
    { at: 0, x: 48, z: -9, side: -1 },
    { at: 8, x: -35, z: 22, side: 1 },
    { at: 22, x: 52, z: 24, side: 1 },
    { at: 34, x: -41, z: -22, side: -1 },
    { at: 49, x: 47, z: -26, side: -1 },
    { at: 60, x: -34, z: 26, side: 1 },
  ] },
]

export function formationFor(wave, { x, z, side }) {
  return [{ across: 0, back: 0 }, { across: -22, back: 21 }, { across: 22, back: 21 }].map(({ across, back }) => {
    const start = flightStart + back
    return {
      x: x + across, y: wave.height, z: z + side * start, yaw: side * Math.PI / 2, jumpers: 3,
      drop: { from: start - wave.zone / 2, to: start + wave.zone / 2 },
    }
  })
}
