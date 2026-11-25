import Interceptor from '/core/gameplay/bodies/aircraft/Interceptor.js'
import { loadedModel } from '/core3d/assets/models.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import WarplaneModel from './WarplaneModel.js'
import ProjectilesModel from '../ProjectilesModel.js'

/**
 * An enemy fighter from a plane module's `description`, once its models are loaded: a body as big as its model, square
 * in plan so a round from any side meets it, the model that shows it and the tracers and rattle of its guns.
 * `options` are the body's, as its target and clock.
 */
export default function makeInterceptor({ model, propeller, propellerName }, options = {}) {
  const mesh = loadedModel(model)
  const size = modelSize(mesh)
  const span = Math.max(size.length, size.width)
  const body = new Interceptor({ size: { ...size, length: span, width: span }, ...options })
  return {
    body,
    model: new WarplaneModel(body, { mesh, propeller: propeller && loadedModel(propeller), propellerName }),
    guns: new ProjectilesModel(body, { shotSound: 'aircraft-gun.mp3' }),
  }
}
