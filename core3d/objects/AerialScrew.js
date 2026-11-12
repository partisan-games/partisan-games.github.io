import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'aircraft/airship/aerial-screw/model.fbx', size: 10, shouldCenter: true }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class AerialScrew extends GameObject {
  constructor(param = {}) {
    super({ mesh: loadedModel(model), ...param })
    this.sign = 1
    this.range = 20
    this.initialY = this.position.y
    this.speed = this.position.y * Math.random() * .1
  }

  update(delta) {
    if (this.position.y > this.initialY + this.range)
      this.sign = -1

    if (this.position.y < this.initialY)
      this.sign = 1

    const speedCooef = this.sign > 0 ? 1 : .5
    this.mesh.rotateY(delta * this.speed * speedCooef)
    this.mesh.translateY(this.sign * delta * this.speed * .33)
  }
}