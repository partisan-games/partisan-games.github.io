import Scena3D from '/core/Scena3D.js'
import { CapoeiraGirlPlayer } from '/core3d/actor/derived/capoeira/CapoeiraGirl.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { html } from './html.js'
import { css } from './style.js'
import { loadFbxAnimations } from '/core3d/loaders.js'

export default class extends Scena3D {
  constructor() {
    super({
      showControls: false,
    })
  }

  async init() {
    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)

    this.player = new CapoeiraGirlPlayer({ camera: this.camera, showHealthBar: false })
    this.add(this.player)

    this.addUI()
  }

  addUI() {
    document.body.insertAdjacentHTML('afterbegin', html)
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }

  async handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button.special')

    if (button) {
      const name = button.innerText
      console.log(name)
      const [clip] = await loadFbxAnimations([name], 'character/capoeira/')
      console.log(clip)
      this.player.addAction(name, clip)
      this.player.setState(name)
    }
  }
}
