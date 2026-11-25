import Warplane from '/core/gameplay/bodies/aircraft/Warplane.js'
import { loadedModel } from '/core3d/assets/models.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import WarplaneModel from './WarplaneModel.js'

/**
 * A warplane from its module's `description`, once its models are loaded: a body as big as its model, and the model
 * that shows it, with its propeller if it has one. `options` are the body's, as its clock and its targets; `impactAt`
 * finds the ground its wreck scorches, as the model takes it.
 */
export default function makeWarplane({ model, propeller, propellerName, physical }, options = {}, { impactAt } = {}) {
  const mesh = loadedModel(model)
  const body = new Warplane({ size: modelSize(mesh), ...options })
  body.physical = physical
  return { body, model: new WarplaneModel(body, { mesh, propeller: propeller && loadedModel(propeller), propellerName, impactAt }) }
}
