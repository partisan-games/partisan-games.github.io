// Three staggered groups, each accompanying its own tank; coordinates are metres.
export const soldiers = [
  { group: 0, x: -5.8, z: 12.3, speed: .58, kind: 'rifleman', phase: 2.1, interval: 4.7 },
  { group: 0, x: -5.4, z: 16.2, speed: .52, kind: 'gunner', phase: 3.4, interval: 5.3 },
  { group: 0, x: -.2, z: 13.4, speed: .50, kind: 'officer', signals: [2.8, 6.8] },
  { group: 1, x: -10.8, z: 25.2, speed: .70, kind: 'rifleman', phase: 1.5, interval: 5.2, crouchAt: 6.25 },
  { group: 1, x: -4.8, z: 23.2, speed: .57, kind: 'backpack', phase: 4.1, interval: 6.3 },
  { group: 1, x: -11.5, z: 22.6, speed: .65, kind: 'gunner', phase: 5.6, interval: 4.9 },
  { group: 2, x: -7.5, z: 34.6, speed: .56, kind: 'rifleman', phase: 7.3, interval: 5.8 },
  { group: 2, x: -10, z: 37.4, speed: .58, kind: 'backpack', phase: 9.2, interval: 6.7 },
  { group: 2, x: -.5, z: 35.8, speed: .50, kind: 'officer', signals: [12.4, 16.4] },
]

export const tanks = [
  { group: 0, x: -3.5, z: 14.5, speed: .52, phase: .12, crewPhase: .3, crewVisible: true },
  { group: 1, x: -8, z: 24, speed: .58, phase: .37, crewPhase: .8, crewVisible: false },
  { group: 2, x: -4, z: 36.5, speed: .48, phase: .61, crewPhase: 1.4, crewVisible: true },
]

export function tankAt(tank, time) {
  return { kind: 'tank', x: tank.x + tank.speed * time, z: tank.z, pose: 'drive',
    poseTime: time + tank.phase, crewTime: time + tank.crewPhase, crewVisible: tank.crewVisible }
}

const signalDuration = 1.4
function signalAt(soldier, time) {
  return soldier.signals?.find(at => time >= at && time < at + signalDuration)
}

// The marching cels move the planted boot back roughly three source pixels every 72 ms.
const marchSpeed = 1.05
const crouchSpeed = .5
const firingTime = .13
const kneelingTime = .175

/** Integrate only moving intervals, so a planted firing or kneeling pose never drifts. */
function travelAt(soldier, time) {
  const crouchAt = soldier.crouchAt ?? Infinity
  const stops = [0, time, crouchAt, crouchAt + kneelingTime]
  for (const at of soldier.signals ?? []) stops.push(at, at + signalDuration)
  for (let shot = soldier.phase; shot < time; shot += soldier.interval) stops.push(shot, shot + firingTime)
  const times = stops.filter(at => at >= 0 && at <= time).sort((a, b) => a - b)
  let standing = 0, crouched = 0
  for (let i = 1; i < times.length; i++) {
    const middle = (times[i - 1] + times[i]) / 2
    if (signalAt(soldier, middle) !== undefined) continue
    if (middle >= crouchAt && middle < crouchAt + kneelingTime) continue
    const age = middle - soldier.phase
    const cycle = Math.max(0, age) % soldier.interval
    const shotAt = middle - cycle
    const validShot = age >= 0 && (shotAt < crouchAt || shotAt >= crouchAt + kneelingTime)
    if (validShot && cycle < firingTime) continue
    const distance = (times[i] - times[i - 1]) * soldier.speed
    if (middle >= crouchAt) crouched += distance * crouchSpeed
    else standing += distance
  }
  return { standing, crouched, x: soldier.x + standing + crouched }
}

// Time, sideways position, height above the field, forward position.
const cameraPath = [
  [0, 0, 2.07, 0], [1.5, -.8, 1.9, 3.6], [3, -2.8, .9, 8],
  [4.8, -1.4, 1.4, 10.3], [6.7, -.6, 1.65, 12.4],
  [8.8, -1.2, 1.7, 15.5], [11, -.4, 1.75, 18],
  [13.4, 3.8, 1.8, 21.2], [15.5, 8, 1.9, 23], [18, 5, 2, 28],
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
  const signal = signalAt(soldier, time)
  if (soldier.kind === 'officer') {
    const travel = travelAt(soldier, time)
    return { x: travel.x, z: soldier.z, kind: soldier.kind, pose: signal === undefined ? 'walk' : 'signal',
      poseTime: signal === undefined ? travel.standing / marchSpeed : time - signal, shotAge: Infinity }
  }
  const age = time - soldier.phase
  const cycle = Math.max(0, age) % soldier.interval
  const crouchAt = soldier.crouchAt ?? Infinity
  const crouched = time >= crouchAt
  const kneeling = crouched && time - crouchAt < kneelingTime
  const shotAt = time - cycle
  const validShot = age >= 0 && (!crouched || shotAt >= crouchAt + kneelingTime)
  const firing = validShot && cycle < firingTime
  const shot = time - cycle >= crouchAt ? 'crouch-fire' : 'fire'
  const untilNextShot = age < 0 ? -age : soldier.interval - cycle
  const raising = untilNextShot <= .10 || (age >= 0 && cycle >= firingTime && cycle < .24)
  const walk = soldier.kind === 'rifleman' && raising ? 'walk-aim' : 'walk'
  const pose = kneeling ? 'kneel' : firing ? shot : crouched ? soldier.speed ? 'crouch-walk' : 'crouch' : walk
  const travel = travelAt(soldier, time)
  const poseTime = kneeling ? time - crouchAt : firing ? cycle
    : crouched ? travel.crouched / (marchSpeed * crouchSpeed) : travel.standing / marchSpeed
  return {
    x: travel.x, z: soldier.z, kind: soldier.kind, pose, shot, poseTime,
    shotAge: validShot && !kneeling ? cycle : Infinity,
    shotX: travelAt(soldier, Math.max(0, shotAt)).x,
  }
}
