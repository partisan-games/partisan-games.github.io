import Building from '/core3d/objects/Building.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = {
  file: 'aircraft/airplane/junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.obj',
  mtl: 'aircraft/airplane/junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.mtl',
  size: 3.9,
}

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class JunkersStuka extends Building {
  constructor(params = {}) {
    super({ mesh: loadedModel(model), randomSmoke: true, name: 'enemy', ...params })
    this.position.y += this.height / 2
  }
}