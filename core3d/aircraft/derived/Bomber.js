import { loadedModel } from '/core3d/assets/models.js'
import Warplane from '../Warplane.js'

const body = { file: 'aircraft/airplane/bomber-lancaster/model.glb', size: 3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

export default class Bomber extends Warplane {
  constructor(params = {}) {
    super({ mesh: loadedModel(body), ...params })
  }
}
