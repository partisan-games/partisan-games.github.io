import { Box3, Vector3 } from 'three'
import Scene3D from '/core/Scene3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight, dirLight } from '/core3d/light.js'
import { createOrbitControls } from '/core3d/helpers.js'

/** How far the floor reaches each way from the middle, in metres. */
const floorSize = 50
const viewDirection = new Vector3(1, .24, .72).normalize()
const viewRight = new Vector3().crossVectors(new Vector3(0, 1, 0), viewDirection).normalize()
const viewUp = new Vector3().crossVectors(viewDirection, viewRight)

/** Project a box's half-size onto one of the camera's axes. */
function extent(size, axis) {
  return (size.x * Math.abs(axis.x) + size.y * Math.abs(axis.y) + size.z * Math.abs(axis.z)) / 2
}

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

  /** Frame the actor itself, including the initial altitude of birds and airships. */
  frame(block) {
    const mesh = block.mesh ?? this.children.find(child => child.body === block)?.mesh
    if (!mesh) return
    // The first rendered frame normally updates these, including each skinned mesh's inverse bind matrix.
    mesh.updateMatrixWorld(true)
    const box = new Box3().setFromObject(mesh, true)
    if (box.isEmpty()) return
    const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3())
    const slope = Math.tan(this.camera.fov * Math.PI / 360)
    // Reserve space beside the actor for the panels and in front of it for the nearest wing or limb.
    const distance = extent(size, viewDirection) + Math.max(extent(size, viewUp) / (.76 * slope),
      extent(size, viewRight) / (.58 * slope * this.camera.aspect))
    this.controls.target.copy(center)
    this.camera.position.copy(center).addScaledVector(viewDirection, Math.max(this.camera.near * 2, distance))
    this.controls.update()
    this.follow(block)
  }

  /** Keeps the camera orbiting `block`, or with none lets it stay where it is. */
  follow(block = null) {
    this.followed = block
    if (block) this.lastPosition = new Vector3().copy(block.mesh?.position ?? block)
  }

  update(dt, t) {
    super.update(dt, t)
    if (!this.followed || !this.controls) return
    // the camera moves with the block, so the view onto it stays as the mouse left it
    const position = this.followed.mesh?.position ?? this.followed
    this.lastPosition.sub(position)
    this.camera.position.sub(this.lastPosition)
    this.controls.target.sub(this.lastPosition)
    this.lastPosition.copy(position)
  }
}
