/*
 * Flight paths of enemy planes. Each gives the position after t seconds of flight,
 * so a plane flies the same way at any frame rate. Planes start outside the screen.
 * `across` is the axis across the first stretch of the path, along which a formation spreads.
 */

const margin = 80 // px outside the screen where planes start

/** Down from the top. */
const straight = {
  across: 'x',
  position: (t, { x, speed, width }) => ({ x: x * width, y: -margin + speed * t }),
}

/** Down from the top, weaving left and right. */
const wave = {
  across: 'x',
  position: (t, { x, speed, width }) => ({
    x: x * width + width * .15 * Math.sin(2 * Math.PI * t / 3),
    y: -margin + speed * t,
  }),
}

/** In from the left or right edge, then a quarter turn down. */
const fromSide = {
  across: 'y',
  position: (t, { side, y, speed, width, height }) => {
    const direction = side === 'right' ? -1 : 1
    const edge = side === 'right' ? width + margin : -margin
    const radius = width * .35
    const top = y * height
    const distance = speed * t
    const angle = distance / radius
    if (angle < Math.PI / 2)
      return { x: edge + direction * radius * Math.sin(angle), y: top + radius - radius * Math.cos(angle) }
    return { x: edge + direction * radius, y: top + radius + distance - radius * Math.PI / 2 }
  },
}

/** Up from below, overtaking the player. */
const fromBelow = {
  across: 'x',
  position: (t, { x, speed, width, height }) => ({ x: x * width, y: height + margin - speed * t }),
}

/** Down to the middle of the screen, a half turn, and back up. */
const uTurn = {
  across: 'x',
  position: (t, { x, side, speed, width, height }) => {
    const direction = side === 'left' ? -1 : 1
    const start = x * width
    const turnAt = height * .45
    const radius = width * .12
    const straightPart = turnAt + margin
    const distance = speed * t
    if (distance < straightPart) return { x: start, y: -margin + distance }

    const angle = (distance - straightPart) / radius
    if (angle < Math.PI)
      return { x: start + direction * (radius - radius * Math.cos(angle)), y: turnAt + radius * Math.sin(angle) }
    return { x: start + direction * 2 * radius, y: turnAt - (distance - straightPart - radius * Math.PI) }
  },
}

/** Down to under the top bar, then left and right across the screen. */
const boss = {
  across: 'x',
  position: (t, { speed, width, height }) => {
    const top = height * .3
    const arrival = (top + margin) / speed
    const y = Math.min(-margin + speed * t, top)
    const x = width / 2 + (t > arrival ? width * .3 * Math.sin((t - arrival) * .6) : 0)
    return { x, y }
  },
}

export const paths = { straight, wave, fromSide, fromBelow, uTurn, boss }
