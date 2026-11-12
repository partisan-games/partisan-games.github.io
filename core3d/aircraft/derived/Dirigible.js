import { loadedModel } from '/core3d/assets/models.js'
import Airship from '../Airship.js'

const body = { file: 'aircraft/airship/dirigible/model.fbx', size: 4, shouldCenter: true, shouldAdjustHeight: true }
const propeller = { file: 'item/propeller/model.fbx', size: 1, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the airship. */
export const models = [body, propeller]

export default class Dirigible extends Airship {
  constructor({ altitude = 20, name = 'player', ...rest } = {}) {
    super({ mesh: loadedModel(body), altitude, name, ...rest })

    const propellerRight = loadedModel(propeller).clone()
    propellerRight.position.set(1.3, .63, .4)
    const propellerLeft = propellerRight.clone()
    propellerLeft.position.set(-1.3, .63, .4)
    this.mesh.add(propellerRight, propellerLeft)
    this.propellers.push(propellerRight, propellerLeft)
  }
}
