import canvas2d from '/core/io/canvas2d.js'

/**
 * Whether an object lies wholly outside what the camera shows. Objects of this game live in world coordinates,
 * so they are judged by the camera (`cameraX`, `cameraY` of the scene), not by the canvas.
 */
export const outsideView = (object, camera) => {
  const x = object.x - camera.cameraX
  const y = object.y - camera.cameraY
  return x < -object.width / 2 || x > canvas2d.width + object.width / 2 ||
    y < -object.height / 2 || y > canvas2d.height + object.height / 2
}
