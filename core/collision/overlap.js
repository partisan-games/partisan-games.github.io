import { toLocal } from './shapes.js'

/** Shapes that only touch do not overlap, as with the old rectangles. */
export function shapesOverlap(a, b) {
  if (a.type === 'circle' && b.type === 'circle') return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r
  if (a.type === 'circle') return circleOverlapsBox(a, b)
  if (b.type === 'circle') return circleOverlapsBox(b, a)
  return boxesOverlap(a, b)
}

export const anyOverlap = (shapes, others) => shapes.some(shape => others.some(other => shapesOverlap(shape, other)))

function circleOverlapsBox(circle, box) {
  const centre = toLocal(circle, box)
  const nearestX = Math.max(-box.halfWidth, Math.min(box.halfWidth, centre.x))
  const nearestY = Math.max(-box.halfHeight, Math.min(box.halfHeight, centre.y))
  return Math.hypot(centre.x - nearestX, centre.y - nearestY) < circle.r
}

const sides = ({ angle }) => [
  { x: Math.cos(angle), y: Math.sin(angle) },
  { x: -Math.sin(angle), y: Math.cos(angle) },
]

/** How far a box reaches from its centre along a unit axis. */
function reach(box, axis) {
  const [along, across] = sides(box)
  return box.halfWidth * Math.abs(along.x * axis.x + along.y * axis.y) +
    box.halfHeight * Math.abs(across.x * axis.x + across.y * axis.y)
}

/** Two boxes overlap unless one of their sides separates them. */
function boxesOverlap(a, b) {
  return [...sides(a), ...sides(b)].every(axis => {
    const distance = Math.abs((b.x - a.x) * axis.x + (b.y - a.y) * axis.y)
    return distance < reach(a, axis) + reach(b, axis)
  })
}
