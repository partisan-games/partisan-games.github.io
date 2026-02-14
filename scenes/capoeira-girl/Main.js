import Scena3D from '/core/Scena3D.js'
import { CapoeiraGirlPlayer } from '/core3d/actor/derived/capoeira/CapoeiraGirl.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { html } from './html.js'
import { css } from './style.js'
const buttons = document.querySelectorAll('.idle,.special')
const moves = [...document.querySelectorAll('.special')].map(btn => btn.innerText)
import { loadFbx } from '/core3d/loaders.js'

export default class extends Scena3D {
  constructor() {
    super({
      showControls: false,
    })
  }

  async init() {
    document.body.insertAdjacentHTML('afterbegin', html)
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)

    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)

    this.player = new CapoeiraGirlPlayer({ camera: this.camera, useKeyboard: false, useJoystick: false })
    this.add(this.player)
    this.player.setState('Ginga')
  }

  async handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button')
    if (!['idle', 'special'].includes(button?.className)) return

    const name = button.innerText
    // const state = button.className
    const res = await loadFbx({ name, file: `character/capoeira/${name}.fbx` })
    const clip = res.children[0].animations[0]
    this.player.addAction(name, clip)
    this.player.setState(name)
  }
}
