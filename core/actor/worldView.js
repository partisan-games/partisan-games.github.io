import canvas2d from '/core/io/canvas2d.js'

/**
 * Whether an object that lives in world coordinates lies wholly outside what the camera shows. Such objects
 * are judged by the camera (`cameraX`, `cameraY` of the scene), not by the canvas.
 */
export const outsideView = (object, camera) => {
  const x = object.x - camera.cameraX
  const y = object.y - camera.cameraY
  return x < -object.width / 2 || x > canvas2d.width + object.width / 2 ||
    y < -object.height / 2 || y > canvas2d.height + object.height / 2
}

/**
 * The part of the world a scene shows, for bodies that leave play once out of sight: `contains(point)` of a point in
 * metres, where `projection` draws it, within the screen of the `camera` (a scene, with `cameraX` and `cameraY` when
 * its view moves) and `margin` pixels around it.
 */
export const screenView = (projection, camera, margin = 20) => ({
  contains(point) {
    const { x, y } = projection.point(point)
    const left = camera.cameraX ?? 0, top = camera.cameraY ?? 0
    return x >= left - margin && x <= left + canvas2d.width + margin && y >= top - margin && y <= top + canvas2d.height + margin
  },
})
