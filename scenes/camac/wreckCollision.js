const dot = (a, b) => a.x * b.x + a.z * b.z
/** Along a body's heading and across it, seen from above. */
const axesOf = body => {
  const cos = Math.cos(body.yaw), sin = Math.sin(body.yaw)
  return [{ x: cos, z: -sin }, { x: sin, z: cos }]
}
const radius = (body, axes, normal) => Math.abs(dot(axes[0], normal)) * body.size.length / 2 +
  Math.abs(dot(axes[1], normal)) * body.size.width / 2

/**
 * Continuous hull contact, seen from above: even a fast step cannot carry the boat through the hull of a sinking wreck
 * while it lies `afloat`; the boat stops on it, loses speed and glances off. Positions before the step are
 * `previousBoat` and `previousWreck`, `{ x, z }` in metres.
 */
export default function collideWithWreck(boat, wreck, previousBoat, previousWreck) {
  if (boat.dead || !wreck?.afloat) return false
  const boatAxes = axesOf(boat), wreckAxes = axesOf(wreck)
  const start = { x: previousBoat.x - previousWreck.x, z: previousBoat.z - previousWreck.z }
  const end = { x: boat.x - wreck.x, z: boat.z - wreck.z }
  const movement = { x: end.x - start.x, z: end.z - start.z }
  let enter = 0, exit = 1, normal = null
  let inside = true, overlap = true, penetration = Infinity, separation = null
  for (const axis of [...boatAxes, ...wreckAxes]) {
    const half = radius(boat, boatAxes, axis) + radius(wreck, wreckAxes, axis)
    const from = dot(start, axis), to = dot(end, axis), speed = dot(movement, axis)
    if (Math.abs(from) >= half) inside = false
    if (Math.abs(to) >= half) overlap = false
    const depth = half - Math.abs(to)
    if (depth < penetration) {
      penetration = depth
      const sign = to < 0 ? -1 : 1
      separation = { x: axis.x * sign, z: axis.z * sign }
    }
    if (speed === 0) {
      if (Math.abs(from) >= half) return false
    } else {
      const a = (-half - from) / speed, b = (half - from) / speed
      const near = Math.min(a, b)
      if (near >= enter) {
        enter = near
        const sign = speed > 0 ? -1 : 1
        normal = { x: axis.x * sign, z: axis.z * sign }
      }
      exit = Math.min(exit, Math.max(a, b))
    }
  }
  if (inside) {
    if (!overlap) return false // let a boat already against it steer away
    normal = separation
    boat.x += normal.x * (penetration + .02)
    boat.z += normal.z * (penetration + .02)
  } else {
    if (!normal || enter > exit || enter < 0 || enter > 1) return false
    boat.x = wreck.x + start.x + movement.x * enter + normal.x * .02
    boat.z = wreck.z + start.z + movement.z * enter + normal.z * .02
  }
  const incoming = boat.vx * normal.x + boat.vz * normal.z
  if (incoming < 0) {
    const tangentX = boat.vx - incoming * normal.x
    const tangentZ = boat.vz - incoming * normal.z
    boat.vx = tangentX * .65 - incoming * .2 * normal.x
    boat.vz = tangentZ * .65 - incoming * .2 * normal.z
  }
  return true
}
