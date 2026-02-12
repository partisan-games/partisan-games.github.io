import Scena3D from '/core/Scena3D.js'
import * as THREE from 'three'
import { createSun } from '/core3d/light.js'
import { loadModel, loadFbxAnimations } from '/core3d/loaders.js'
import { getCursorPosition } from '/core3d/helpers.js'

const canvas = document.getElementById('malo-platno')

function cursorToDegrees(cursor, degreeMax) {
  const { x, y } = cursor
  let degreeX = 0, degreeY = 0
  const halfX = window.innerWidth / 2
  const halfY = window.innerHeight / 2

  const xdiff = x - halfX
  degreeX = degreeMax * xdiff / halfX

  const ydiff = y - halfY
  if (ydiff < 0) degreeMax *= 0.5
  degreeY = degreeMax * ydiff / halfY

  return { x: degreeX, y: degreeY }
}

function lookAt(cursor, joint, degreeMax) {
  const degrees = cursorToDegrees(cursor, degreeMax)
  joint.rotation.y = THREE.MathUtils.degToRad(degrees.x)
  joint.rotation.x = THREE.MathUtils.degToRad(degrees.y)
}

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      canvas,
      canvasWidth: 250,
      canvasHeight: 250,
    })
    this.followCursor = this.followCursor.bind(this)
  }

  async init() {
    this.addMesh(createSun())
    this.bojaPlatna = 'transparent'
    this.camera.position.set(0, 1, 1.75)

    const mesh = await loadModel({ file: 'character/soldier/partisan.fbx' })
    const animations = await loadFbxAnimations({ idle: 'Rifle Idle' }, 'character/soldier/')

    this.rightHand = null
    this.leftHand = null
    mesh.traverse(child => {
      if (child.name === 'mixamorigRightHand') this.rightHand = child
      if (child.name === 'mixamorigLeftHandMiddle1') this.leftHand = child
      if (child.name === 'mixamorigNeck') this.neck = child
      if (child.name === 'mixamorigSpine') this.spine = child
    })
    this.twoHandedWeapon = await loadModel({ file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI })
    this.rightHand.add(this.twoHandedWeapon)
    this.addMesh(mesh)

    this.mixer = new THREE.AnimationMixer(mesh)
    const clip = animations[0]
    // removes spine and neck from animation
    clip.tracks = clip.tracks.filter(t => !t.name.includes('Spine') && !t.name.includes('Neck'))
    this.mixer.clipAction(clip).play()

    document.addEventListener('pointermove', this.followCursor)
  }

  followCursor(e) {
    const cursor = getCursorPosition(e)
    lookAt(cursor, this.neck, 40)
    lookAt(cursor, this.spine, 40)
  }

  update(dt, t) {
    super.update(dt)
    this.mixer?.update(dt)
    if (this.twoHandedWeapon) this.updateRifle()
  }

  updateRifle() {
    const pos = new THREE.Vector3()
    this.leftHand.getWorldPosition(pos)
    this.twoHandedWeapon.lookAt(pos)
  }

  end() {
    super.end()
    document.removeEventListener('pointermove', this.followCursor)
  }
}
