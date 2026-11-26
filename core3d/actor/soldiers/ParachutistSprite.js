import { billboard } from '/core3d/assets/pixelArt.js'

/**
 * The paratrooper's helmet-to-boots span is 180 px for his 1.8 m. The bottom edge is the foot anchor.
 */
export const parachutistArt = {
  picture: 'game-ready/vojnici/drvar-padobranac.webp',
  pxPerMeter: 100,
}

/**
 * A paratrooper under his canopy, drawn from `texture`, facing the camera.
 * Once he is down, landed or dead, the scene shows him as a soldier on foot, and his canopy is gone.
 */
export default class ParachutistSprite {
  constructor(body, { texture, pxPerMeter = parachutistArt.pxPerMeter }) {
    this.body = body
    this.mesh = billboard(texture, { pxPerMeter })
    this.update()
  }

  update() {
    const { body, mesh } = this
    mesh.visible = body.feet > body.groundAt(body.x, body.z)
    mesh.position.set(body.x, body.feet, body.z)
  }
}
