import Scene3D from '/core/Scene3D.js'
import { description as capoeiraGirl, model } from './Character.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import { icons } from '/core/io/icons.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { html } from './html.js'
import { css } from './style.js'
import { requestModel } from '/core3d/assets/models.js'
import SpecialActions from './SpecialActions.js'

export default class CapoeiraGirlScene extends Scene3D {
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

    const { body, model: view } = leadCharacter(this, capoeiraGirl, { input: { buttonDict: { attack: icons.unarmed, jump: '' } },
      view: { showHealthBar: false } })
    this.player = body

    this.addUI()
    this.actions = new SpecialActions({
      body, model: view, session: this.session,
      loadClip: name => requestModel({ file: `${name}.fbx`, prefix: 'character/huntress/', name })
        .then(mesh => mesh.userData.animations[0]),
    })
    this.controllers.push(this.actions)
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
    const button = e.target.closest('button.special')
    if (!button || this.session.state !== 'running' || this.ui.screen || !this.player) return

    await this.actions.select(button.innerText)
  }
}
