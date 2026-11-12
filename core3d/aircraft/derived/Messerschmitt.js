import { loadedModel } from '/core3d/assets/models.js'
import Warplane from '../Warplane.js'

const body = { file: 'aircraft/airplane/messerschmitt-bf-109/model.fbx', size: 2.5 }
const propeller = { file: 'item/propeller/model.fbx', size: 2, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, propeller]

export default class Messerschmitt extends Warplane {
  constructor(params = {}) {
    super({ mesh: loadedModel(body), ...params })
    this.propeller = loadedModel(propeller).clone()
  }
}
