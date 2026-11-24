import { Box3, Spherical, Vector3 } from 'three'
import Scene3D from '/core/Scene3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight, dirLight } from '/core3d/light.js'
import { createOrbitControls } from '/core3d/helpers.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import stageColors from './stageColors.js'

/** How far the floor reaches each way from the middle, in metres. */
const floorSize = 50
const viewDirection = new Vector3(1, .24, .72).normalize()
const viewRight = new Vector3().crossVectors(new Vector3(0, 1, 0), viewDirection).normalize()
const viewUp = new Vector3().crossVectors(viewDirection, viewRight)

/** Pixels in a line and in a page of a wheel event, for browsers that report a touchpad in lines, as Firefox does. */
const wheelPixels = [1, 16, 800]

/**
 * How far a two-finger touchpad scroll moves, in pixels across and up, or null for a wheel event that zooms: a pinch,
 * which browsers report as ctrl+wheel, or a mouse wheel, which steps one axis by whole, large notches.
 */
export function touchpadMove(event) {
  const scale = wheelPixels[event.deltaMode] ?? 1
  const across = event.deltaX * scale, up = event.deltaY * scale
  const mouseWheel = !event.deltaX && Number.isInteger(event.deltaY) && Math.abs(up) >= 48
  return event.ctrlKey || mouseWheel ? null : { across, up }
}

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
    this.addMesh(createFloor({ size: floorSize * 2, color: stageColors.ground }))
    this.camera.position.set(0, 3, 6)
    this.controls = await createOrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1, 0)
    this.enableTouchpadRotation()
  }

  /** A two-finger touchpad scroll orbits the preview; a pinch and a mouse wheel keep zooming. */
  enableTouchpadRotation() {
    const canvas = this.renderer.domElement
    const offset = new Vector3(), spherical = new Spherical()
    const rotate = event => {
      // a zoom stays with OrbitControls
      const move = touchpadMove(event)
      if (!move) return
      event.preventDefault()
      event.stopImmediatePropagation()
      offset.copy(this.camera.position).sub(this.controls.target)
      spherical.setFromVector3(offset)
      spherical.theta += move.across * .004
      spherical.phi += move.up * .004
      spherical.phi = Math.max(this.controls.minPolarAngle,
        Math.min(this.controls.maxPolarAngle, spherical.phi))
      spherical.makeSafe()
      this.camera.position.copy(this.controls.target).add(offset.setFromSpherical(spherical))
      this.camera.lookAt(this.controls.target)
      this.controls.update()
    }
    canvas.addEventListener('wheel', rotate, { capture: true, passive: false })
    this.session.scope.add(() => canvas.removeEventListener('wheel', rotate, true))
  }

  /** Moves the camera nearer the middle it orbits, or farther with a `factor` below 1. */
  zoomBy(factor) {
    const { camera, controls } = this
    const offset = camera.position.clone().sub(controls.target).divideScalar(factor)
    const distance = Math.min(controls.maxDistance, Math.max(Math.max(controls.minDistance, camera.near * 2), offset.length()))
    camera.position.copy(controls.target).add(offset.setLength(distance))
    controls.update()
  }

  /** Frames `block` again as it was first shown, keeping whether the camera follows it. */
  resetView(block) {
    const { followed } = this
    this.frame(block)
    this.follow(followed)
  }

  /** Frame the actor itself, including the initial altitude of birds and airships. */
  frame(block) {
    const mesh = block.mesh ?? this.children.find(child => child.body === block)?.mesh
    if (!mesh) return
    optimizeGeometry(mesh)
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
