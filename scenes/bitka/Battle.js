// Coordinates and heights are in metres. The soldiers follow their own cues in world space.
export const soldiers = [
  { x: -3.55, z: 11.1, speed: .35, kind: 'gunner', phase: .12, interval: .87 },
  { x: -7.25, z: 11.8, speed: .46, kind: 'rifleman', phase: .32, interval: 1.31 },
  { x: -9.8, z: 19.25, speed: .65, kind: 'gunner', phase: .71, interval: .93 },
  { x: -11, z: 18.4, speed: .82, kind: 'rifleman', phase: .22, interval: 1.24 },
  { x: -12.7, z: 17.2, speed: .76, kind: 'rifleman', phase: .43, interval: 1.37 },
  { x: -13.3, z: 21.5, speed: .72, kind: 'rifleman', phase: .39, interval: 1.18 },
  { x: -10.7, z: 21.2, speed: .92, kind: 'rifleman', phase: .57, interval: 1.22, crouchAt: 6.25 },
]

export const tank = { x: -9.35, z: 21.65, speed: .65, height: 2.27 }

// Time, sideways position, height above the field, forward position.
const cameraPath = [
  [0, 0, 2.07, 0], [1.52, -.85, 1.91, 3.6], [2.24, -1.9, 1.28, 6.05],
  [3, -2.94, .79, 8.55], [3.78, -3.82, .95, 10.9], [4.58, -4.60, 1.48, 12.45],
  [5.45, -4.62, 1.83, 13.4], [6.25, -3.35, 1.77, 13.99], [7.55, -.15, 1.68, 14.94],
  [8.65, 1.65, 1.64, 15.76],
]

export const duration = cameraPath.at(-1)[0]

function tangent(previous, current, next, axis) {
  const incoming = (current[axis] - previous[axis]) / (current[0] - previous[0])
  const outgoing = (next[axis] - current[axis]) / (next[0] - current[0])
  return incoming * outgoing > 0 ? 2 * incoming * outgoing / (incoming + outgoing) : 0
}

export function cameraAt(time) {
  const end = cameraPath.findIndex(([at]) => at > time)
  if (end === -1) return cameraPath.at(-1).slice(1)

  const from = cameraPath[end - 1]
  const to = cameraPath[end]
  const previous = cameraPath[end - 2]
  const next = cameraPath[end + 1]
  const dt = to[0] - from[0]
  const t = (time - from[0]) / dt
  const p = t * t * (3 - 2 * t)
  return [1, 2, 3].map(axis => {
    const a = previous ? tangent(previous, from, to, axis) : 0
    const b = next ? tangent(from, to, next, axis) : 0
    return from[axis] * (1 - p) + to[axis] * p + dt * t * (1 - t) * (a * (1 - t) - b * t)
  })
}

export function soldierAt(soldier, time) {
  const age = time - soldier.phase
  const cycle = Math.max(0, age) % soldier.interval
  const firing = age >= 0 && cycle < .13
  const crouched = time >= (soldier.crouchAt ?? Infinity)
  const x = soldier.x + time * soldier.speed - (firing ? .035 * (1 - cycle / .13) : 0)
  return {
    x, z: soldier.z,
    kind: crouched ? 'riflemanLow' : soldier.kind,
    height: crouched ? 1.12 : 1.72,
    lift: firing || crouched ? 0 : Math.abs(Math.sin((time + soldier.phase) * 9)) * .023,
    shotAge: age >= 0 ? cycle : Infinity,
    shotX: soldier.x + (time - cycle) * soldier.speed,
  }
}
