/** Unturned rectangles centred on x, y: the collision every 2D object has without its own shapes. */

const left = object => object.x - object.width / 2

const right = object => object.x + object.width / 2

const top = object => object.y - object.height / 2

const bottom = object => object.y + object.height / 2

/** Rectangles that only touch do not overlap. */
export function overlaps(a, b) {
  return (
    bottom(a) > top(b) &&
    top(a) < bottom(b) &&
    right(a) > left(b) &&
    left(a) < right(b)
  )
}

export function isInside(point, object) {
  return (
    point.x > left(object) &&
    point.x < right(object) &&
    point.y > top(object) &&
    point.y < bottom(object)
  )
}
