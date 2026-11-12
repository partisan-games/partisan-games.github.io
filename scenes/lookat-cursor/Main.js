import Scena3D from '/core/Scena3D.js'
import * as THREE from 'three'
import { createSun } from '/core3d/light.js'
import { requestModel } from '/core3d/assets/models.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
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
      disableEvents: true,
      showControls: false,
    })
    this.followCursor = this.followCursor.bind(this)
  }

  async init() {
    this.addMesh(createSun())
    this.bojaPlatna = 'transparent'
    this.camera.position.set(0, 1, 1.75)

    const model = await this.session.keep(requestModel({ file: 'partisan.fbx', prefix: 'character/soldier/', animDict: { idle: 'Rifle Idle' } }))
    const mesh = clone(model)
    this.addMesh(mesh)

    this.rightHand = null
    this.leftHand = null
    mesh.traverse(child => {
      if (child.name === 'mixamorigRightHand') this.rightHand = child
      if (child.name === 'mixamorigLeftHandMiddle1') this.leftHand = child
      if (child.name === 'mixamorigNeck') this.neck = child
      if (child.name === 'mixamorigSpine') this.spine = child
    })
    const rifle = await this.session.keep(requestModel({ file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }))
    this.twoHandedWeapon = clone(rifle)
    this.rightHand.add(this.twoHandedWeapon)

    this.mixer = new THREE.AnimationMixer(mesh)
    const clip = model.userData.animations[0].clone()
    // removes spine and neck from animation
    clip.tracks = clip.tracks.filter(t => !t.name.includes('Spine') && !t.name.includes('Neck'))
    this.mixer.clipAction(clip).play()
    this.session.scope.add(() => {
      this.mixer.stopAllAction()
      this.mixer.uncacheRoot(mesh)
    })

    document.addEventListener('pointermove', this.followCursor)
    this.session.scope.add(() => document.removeEventListener('pointermove', this.followCursor))
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

}
