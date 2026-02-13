import Scena3D from '/core/Scena3D.js'
import * as THREE from 'three'
import { createSun } from '/core3d/light.js'
import { loadModel, loadFbxAnimations } from '/core3d/loaders.js'
import { getCursorPosition } from '/core3d/helpers.js'

function cursorToDegrees(cursor, degreeMax) {
  const { x, y } = cursor

  // calculate relative distance from center (-1 to 1)
  const percentX = (x - window.innerWidth / 2) / (window.innerWidth / 2)
  const percentY = (y - window.innerHeight / 2) / (window.innerHeight / 2)

  return {
    x: percentX * degreeMax,
    y: percentY * (percentY < 0 ? degreeMax * 0.5 : degreeMax)
  }
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
      canvas: document.getElementById('malo-platno'),
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
    super.update(dt, t)
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
