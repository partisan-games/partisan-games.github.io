import { loadedModel } from '/core3d/assets/models.js'
import Warplane from '../Warplane.js'

const body = { file: 'aircraft/airplane/triplane-sopwith/triplane.fbx', size: 3 }
const propeller = { file: 'item/propeller/model.fbx', size: 1.5, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, propeller]

export default class Triplane extends Warplane {
  constructor(params = {}) {
    super({ mesh: loadedModel(body), ...params })
    this.propeller = loadedModel(propeller).clone()
  }
}
