import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { CapoeiraGirlPlayer } from '/core3d/actor/derived/capoeira/CapoeiraGirl.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { html } from './html.js'
import { css } from './style.js'
import { loadFbx } from '/core3d/loaders.js'
import { createOrbitControls } from '/core3d/helpers.js'

const defaultCameraPos = new THREE.Vector3(0, .9, 2.75)
const cameraTarget = new THREE.Vector3(0, defaultCameraPos.y, 0)

export default class extends Scena3D {
  constructor() {
    super({
      showControls: false,
    })
  }

  async init() {
    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.controls.target = cameraTarget
    document.body.insertAdjacentHTML('afterbegin', html)
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)

    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)

    this.camera.position.copy(defaultCameraPos)

    this.player = new CapoeiraGirlPlayer({ useKeyboard: false, useJoystick: false, showHealthBar: false })
    this.add(this.player)
    this.player.setState('Ginga')
  }

  async handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button')

    if (button.id == 'camera') this.toggleCamera()

    if (!['idle', 'special'].includes(button?.className)) return

    const name = button.innerText
    const state = button.className
    const res = await loadFbx({ name, file: `character/capoeira/${name}.fbx` })
    const clip = res.children[0].animations[0]
    this.player.addAction(name, clip)
    this.player.setState(name, state)
  }

  toggleCamera() {
    const newZ = this.camera.position.z > 0 ? -defaultCameraPos.z * 1.2 : defaultCameraPos.z
    const newY = this.camera.position.z > 0 ? defaultCameraPos.y * .75 : defaultCameraPos.y
    this.camera.position.set(defaultCameraPos.x, newY, newZ)
    cameraTarget.y = newY
  }
}
