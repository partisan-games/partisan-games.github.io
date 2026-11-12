import Scena3D from '/core/Scena3D.js'
import CapoeiraGirl, { model } from './Character.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { html } from './html.js'
import { css } from './style.js'
import { requestModel } from '/core3d/assets/models.js'
import SpecialActions from './SpecialActions.js'

export default class extends Scena3D {
  constructor() {
    super({
      showControls: false,
    })
  }

  async init() {
    await this.session.keep(requestModel(model))
    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)

    this.player = new CapoeiraGirl({ camera: this.camera, showHealthBar: false, useComposedMovement: true })
    this.add(this.player)

    this.addUI()
    this.actions = new SpecialActions({
      player: this.player, session: this.session,
      loadClip: name => requestModel({ file: `${name}.fbx`, prefix: 'character/huntress/', name })
        .then(mesh => mesh.userData.animations[0]),
    })
  }

  addUI() {
    const container = document.createElement('div')
    container.innerHTML = html
    this.uiElements = [...container.children]
    document.body.prepend(...this.uiElements)
    this.style = document.createElement('style')
    this.style.textContent = css
    document.head.appendChild(this.style)
    this.session.scope.add(() => {
      this.uiElements.forEach(element => element.remove())
      this.style.remove()
    })
  }

  async handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button.special')
    if (!button || !this.session.active || !this.player) return

    await this.actions.select(button.innerText)
  }
}
