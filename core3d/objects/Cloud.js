import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'nature/cloud/lowpoly.gltf', size: 20, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class Cloud extends GameObject {
  constructor({ mapSize = 400, ...rest } = {}) {
    super({ mesh: loadedModel(model), ...rest })
    this.mesh.position.y = 120
    this.halfSize = mapSize / 2
    this.speed = Math.random() + .5
  }

  update(delta) {
    this.position.x += delta * this.speed

    if (this.position.x > this.halfSize)
      this.position.x = -this.halfSize
  }
}
