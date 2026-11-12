import { loadedModel } from '/core3d/assets/models.js'
import Warplane from '../Warplane.js'

const body = { file: 'aircraft/airplane/f18/model.fbx', size: 3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

// dodati potisak

export default class F18 extends Warplane {
  constructor(params = {}) {
    super({ mesh: loadedModel(body), ...params })
  }
}
