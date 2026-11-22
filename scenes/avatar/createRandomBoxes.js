import { createRandomBoxes as originalBoxes } from '/core3d/geometry/index.js'

/** Preserve the original scatter and colours; redraw only positions that intersect an earlier cube. */
export default function createRandomBoxes({ n = 100, size = 5, mapSize = 100, maxAttempts = 1000 } = {}) {
  const boxes = originalBoxes({ n, size, mapSize })
  const intersects = (a, b) => Math.abs(a.x - b.x) < size
    && Math.abs(a.y - b.y) < size && Math.abs(a.z - b.z) < size
  for (let i = 0; i < boxes.length; i++) {
    const { position } = boxes[i]
    let attempts = 0
    while (boxes.slice(0, i).some(box => intersects(position, box.position))) {
      if (attempts++ >= maxAttempts) {
        boxes.forEach(box => {
          box.geometry.dispose()
          box.material.dispose()
        })
        throw new RangeError('Cannot place the Avatar cubes without intersections')
      }
      position.set((.5 - Math.random()) * mapSize, -5 + Math.random() * (mapSize * .25 + 5), (.5 - Math.random()) * mapSize)
    }
  }
  return boxes
}
