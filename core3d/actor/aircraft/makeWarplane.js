import { Box3 } from 'three'
import Warplane from '/core/gameplay/bodies/aircraft/Warplane.js'
import { loadedModel } from '/core3d/assets/models.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import WarplaneModel from './WarplaneModel.js'

/** How high in the model, as a share of its height from its lowest point, its missiles leave it. */
const belly = .2

/**
 * A warplane from its module's `description`, once its models are loaded: a body as big as its model, and the model
 * that shows it, with its propeller if it has one. `options` are the body's, as its clock and its targets; `impactAt`
 * finds the ground its wreck scorches, as the model takes it.
 */
export default function makeWarplane({ model, propeller, propellerNames, discPropellers, physical, performance },
  options = {}, { impactAt } = {}) {
  const mesh = loadedModel(model)
  // missiles leave from low in the fuselage, wherever the model has its origin
  const { min, max } = new Box3().setFromObject(mesh)
  const body = new Warplane({ size: modelSize(mesh), launchHeight: min.y + (max.y - min.y) * belly, performance, ...options })
  body.physical = physical
  return { body, model: new WarplaneModel(body, { mesh, propeller: propeller && loadedModel(propeller), propellerNames,
    discPropellers: discPropellers && { ...discPropellers, mesh: loadedModel(discPropellers.model) }, impactAt }) }
}
