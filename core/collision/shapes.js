/**
 * Collision shapes: a circle, or a box (rectangle) turned by `angle` around its centre.
 * A shape is measured in the frame the renderer draws its object in: from the object's position,
 * in drawn pixels (the image size already includes the object's `scale`), before its angle, flips and scales.
 */

export const circle = (x, y, r) => ({ type: 'circle', x, y, r })

export const box = (x, y, width, height, angle = 0) =>
  ({ type: 'box', x, y, halfWidth: width / 2, halfHeight: height / 2, angle })

/** Shapes measured in pixels of an image that is drawn centred on its object, at this scale. */
export function fromImage({ width, height }, scale, shapes) {
  return shapes.map(shape => {
    const x = (shape.x - width / 2) * scale
    const y = (shape.y - height / 2) * scale
    return shape.type === 'circle'
      ? circle(x, y, shape.r * scale)
      : { ...shape, x, y, halfWidth: shape.halfWidth * scale, halfHeight: shape.halfHeight * scale }
  })
}

/**
 * The shape where its body is drawn. The renderer translates, rotates, then scales by
 * (flipY, flipX) and (scaleX, scaleY): `flipY` mirrors left and right, `flipX` up and down.
 * A turned box keeps its proportions, so its body must scale both axes equally.
 */
export function placeShape(shape, { x, y, angle = 0, flipX = 1, flipY = 1, scaleX = 1, scaleY = 1 }) {
  const horizontal = flipY * scaleX
  const vertical = flipX * scaleY
  const localX = shape.x * horizontal
  const localY = shape.y * vertical
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const centre = { x: x + localX * cos - localY * sin, y: y + localX * sin + localY * cos }
  if (shape.type === 'circle') return circle(centre.x, centre.y, shape.r * Math.abs(horizontal))

  const mirrored = horizontal * vertical < 0
  return {
    ...shape, ...centre,
    halfWidth: shape.halfWidth * Math.abs(horizontal),
    halfHeight: shape.halfHeight * Math.abs(vertical),
    angle: angle + (mirrored ? -shape.angle : shape.angle),
  }
}

/** A point in the frame of a box: from its centre, along its sides. */
export function toLocal(point, { x, y, angle }) {
  const dx = point.x - x
  const dy = point.y - y
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
}

/** The shapes an object collides with: its collider's, or the unturned rectangle of its size. */
export const shapesOf = object =>
  object.collider ? object.collider.shapes() : [box(object.x, object.y, object.width, object.height)]
