import { loadedModel } from '/core3d/assets/models.js'
import Airship from '/core/gameplay/bodies/aircraft/Airship.js'
import AirshipModel from '/core3d/actor/aircraft/AirshipModel.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'

const hull = { file: 'aircraft/airship/dirigible/model.fbx', size: 4, shouldCenter: true, shouldAdjustHeight: true }
const propeller = { file: 'item/propeller/model.fbx', size: 1, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the airship. */
export const models = [hull, propeller]

/** Its two propellers, on the hull's sides, in metres from where it stands. */
const propellerPlaces = [[1.3, .63, .4], [-1.3, .63, .4]]

/** A dirigible once its models are loaded: an airship body as big as its hull, and the model that shows it. */
export default function makeDirigible(options = {}) {
  const mesh = loadedModel(hull)
  const body = new Airship({ size: modelSize(mesh), ...options })
  return { body, model: new AirshipModel(body, { mesh, propeller: loadedModel(propeller), propellerPlaces }) }
}
