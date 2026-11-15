const dot = (a, b) => a.x * b.x + a.y * b.y
const axesOf = actor => {
  const cos = Math.cos(actor.ugao), sin = Math.sin(actor.ugao)
  return [{ x: cos, y: sin }, { x: -sin, y: cos }]
}
const radius = (actor, axes, normal) => Math.abs(dot(axes[0], normal)) * actor.sirina / 2 +
  Math.abs(dot(axes[1], normal)) * actor.visina / 2

/** Continuous rectangle contact: even a fast frame cannot carry the boat through a surface wreck. */
export default function collideWithWreck(player, wreck, previousPlayer, previousWreck) {
  if (player.dead || !wreck.vidljiv || !wreck.wreck.solid) return false
  const playerAxes = axesOf(player), wreckAxes = axesOf(wreck)
  const start = { x: previousPlayer.x - previousWreck.x, y: previousPlayer.y - previousWreck.y }
  const end = { x: player.x - wreck.x, y: player.y - wreck.y }
  const movement = { x: end.x - start.x, y: end.y - start.y }
  let enter = 0, exit = 1, normal = null
  let inside = true, overlap = true, penetration = Infinity, separation = null
  for (const axis of [...playerAxes, ...wreckAxes]) {
    const half = radius(player, playerAxes, axis) + radius(wreck, wreckAxes, axis)
    const from = dot(start, axis), to = dot(end, axis), speed = dot(movement, axis)
    if (Math.abs(from) >= half) inside = false
    if (Math.abs(to) >= half) overlap = false
    const depth = half - Math.abs(to)
    if (depth < penetration) {
      penetration = depth
      const sign = to < 0 ? -1 : 1
      separation = { x: axis.x * sign, y: axis.y * sign }
    }
    if (speed === 0) {
      if (Math.abs(from) >= half) return false
    } else {
      const a = (-half - from) / speed, b = (half - from) / speed
      const near = Math.min(a, b)
      if (near >= enter) {
        enter = near
        const sign = speed > 0 ? -1 : 1
        normal = { x: axis.x * sign, y: axis.y * sign }
      }
      exit = Math.min(exit, Math.max(a, b))
    }
  }
  if (inside) {
    if (!overlap) return false // Let an already overlapping player steer away.
    normal = separation
    player.x += normal.x * (penetration + .5)
    player.y += normal.y * (penetration + .5)
  } else {
    if (!normal || enter > exit || enter < 0 || enter > 1) return false
    player.x = wreck.x + start.x + movement.x * enter + normal.x * .5
    player.y = wreck.y + start.y + movement.y * enter + normal.y * .5
  }
  const incoming = player.dx * normal.x + player.dy * normal.y
  if (incoming < 0) {
    const tangentX = player.dx - incoming * normal.x
    const tangentY = player.dy - incoming * normal.y
    player.dx = tangentX * .65 - incoming * .2 * normal.x
    player.dy = tangentY * .65 - incoming * .2 * normal.y
  }
  return true
}
