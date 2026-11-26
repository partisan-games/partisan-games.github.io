import Interceptor from '/core/gameplay/bodies/aircraft/Interceptor.js'
import { loadedModel } from '/core3d/assets/models.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import WarplaneModel from './WarplaneModel.js'
import ProjectilesModel from '../ProjectilesModel.js'

/**
 * An enemy fighter from a plane module's `description`, once its models are loaded: a body as big as its model, square
 * in plan so a round from any side meets it, the model that shows it and the tracers and rattle of its guns.
 * `options` are the body's, as its target and clock; `impactAt` finds the ground its wreck scorches, as the model
 * takes it.
 */
export default function makeInterceptor({ model, propeller, propellerNames, physical }, options = {}, { impactAt } = {}) {
  const mesh = loadedModel(model)
  const size = modelSize(mesh)
  const span = Math.max(size.length, size.width)
  const body = new Interceptor({ size: { ...size, length: span, width: span }, ...options })
  body.physical = physical
  return {
    body,
    model: new WarplaneModel(body, { mesh, propeller: propeller && loadedModel(propeller), propellerNames, impactAt }),
    guns: new ProjectilesModel(body, { shotSound: 'aircraft-gun.mp3' }),
  }
}
