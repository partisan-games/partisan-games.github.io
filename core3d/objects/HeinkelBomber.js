import Building from '/core3d/objects/Building.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = {
  file: 'aircraft/airplane/heinkel-he-111/model.fbx',
  size: 4,
  angle: .125,
  axis: [1, 0, 0],
}

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class HeinkelBomber extends Building {
  constructor(params = {}) {
    super({ mesh: loadedModel(model), randomSmoke: true, name: 'enemy', ...params })
    this.position.y += this.height * .27
  }
}