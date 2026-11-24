import { billboard } from '/core3d/assets/pixelArt.js'

/**
 * The German paratroopers under their canopies, all drawn alike: the man hangs at the foot of the picture, 72 px for
 * his 1.8 m.
 */
export const parachutistArt = {
  pictures: [1, 2, 3, 4].map(n => `armies/nemci/padobranci/padobranac-0${n}.png`),
  pxPerMeter: 40,
}

/**
 * A paratrooper under his canopy, drawn from `texture`, one of the pictures of `parachutistArt`, facing the camera.
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
