import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'building/wizard-isle/model.glb', size: 20 }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class WizardIsle extends GameObject {
  constructor(param = {}) {
    super({ mesh: loadedModel(model), ...param })
    this.time = Math.random()
    this.mesh.rotateY(this.time * Math.PI * 2)
    this.initialY = this.position.y
  }

  update(delta) {
    this.time += delta * .5
    this.position.y = this.initialY + Math.sin(this.time)
  }
}