/** How fast a body standing on ground that gives way falls to the ground below, in metres a second squared. */
export const ground = { gravity: 22.5 }

/**
 * Keeps `body` standing `height` metres above its `groundAt(footX)`: on ground that gives way it falls with gravity,
 * never below it; ground that rises under it lifts it at once. No time, no fall: a paused game stands still.
 */
export function stand(body, dt, { footX = body.x, height = body.size.height / 2 } = {}) {
  const top = body.groundAt(footX) + height
  body.fallSpeed ??= 0
  if (body.y <= top) {
    body.y = top
    body.fallSpeed = 0
    return
  }
  body.fallSpeed += ground.gravity * dt
  body.y = Math.max(top, body.y - body.fallSpeed * dt)
  if (body.y === top) body.fallSpeed = 0
}
