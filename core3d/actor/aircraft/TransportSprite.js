import { Vector3 } from 'three'
import { billboard } from '/core3d/assets/pixelArt.js'

/** The Ju 52 drawn from the side with its nose to the left, 824 px for its 18.9 m. */
export const transportArt = { picture: 'armies/nemci/avioni/junkers-ju-52.png', pxPerMeter: 824 / 18.9 }

const right = new Vector3()

/**
 * A transport plane seen from the side, drawn from `texture`, the picture of `transportArt`, facing `camera`; its nose
 * points the way it flies across the view.
 */
export default class TransportSprite {
  constructor(body, { texture, camera, pxPerMeter = transportArt.pxPerMeter }) {
    Object.assign(this, { body, camera })
    this.mesh = billboard(texture, { pxPerMeter })
    this.mesh.center.set(.5, .5)
    this.update()
  }

  update() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.y, body.z)
    right.setFromMatrixColumn(this.camera.matrixWorld, 0)
    // a sprite draws its size, whatever its sign, so the picture is mirrored in its texture
    const { map } = mesh.material
    const mirrored = body.vx * right.x + body.vz * right.z > 0
    map.repeat.x = mirrored ? -1 : 1
    map.offset.x = mirrored ? 1 : 0
  }
}
