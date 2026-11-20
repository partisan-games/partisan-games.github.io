import Scene3D from '/core/Scene3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight, dirLight } from '/core3d/light.js'
import { createOrbitControls } from '/core3d/helpers.js'

/** How far the floor reaches each way from the middle, in metres. */
const floorSize = 50

/**
 * An empty 3D world where one building block lives on its own: light, a floor and a camera that orbits the middle
 * with the mouse.
 */
export default class Stage3D extends Scene3D {
  constructor() {
    super({ disableEvents: true, showControls: false })
  }

  async init() {
    // the sun gives the shape and the shadow, the even light the side away from it
    ambLight({ scene: this.scene, intensity: Math.PI * .6 })
    dirLight({ scene: this.scene })
    this.addMesh(createFloor({ size: floorSize * 2 }))
    this.camera.position.set(0, 3, 6)
    this.controls = await createOrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1, 0)
  }

  /** Keeps the camera orbiting `block`, or with none lets it stay where it is. */
  follow(block = null) {
    this.followed = block
  }

  update(dt, t) {
    super.update(dt, t)
    if (!this.followed || !this.controls) return
    // the camera moves with the block, so the view onto it stays as the mouse left it
    const { x, z } = this.followed.mesh.position
    const { target } = this.controls
    this.camera.position.x += x - target.x
    this.camera.position.z += z - target.z
    target.set(x, target.y, z)
  }
}
