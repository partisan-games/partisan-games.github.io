import Building from '/core3d/objects/Building.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = {
  file: 'aircraft/airplane/dornier-do-217/WXSUTGFGGAETK9J6AYCJWA8OO.obj',
  mtl: 'aircraft/airplane/dornier-do-217/WXSUTGFGGAETK9J6AYCJWA8OO.mtl',
  size: 3
}

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class DornierBomber extends Building {
  constructor(params = {}) {
    super({ mesh: loadedModel(model), randomSmoke: true, name: 'enemy', ...params })
    this.position.y += this.height / 2
  }
}