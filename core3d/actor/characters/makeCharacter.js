import Character from '/core/gameplay/bodies/characters/Character.js'
import { loadedModel } from '/core3d/assets/models.js'
import CharacterModel, { clipLengths, modelSize } from './CharacterModel.js'

/**
 * A character from its module's `description`, once its models are loaded: a body as big as its model, its actions
 * as long as its clips, and the model that shows it. `options` are the body's, as where it stands and what it hits;
 * `impactAt` is the view's query for a bullet's mark on the world.
 */
export default function makeCharacter({ model, animDict, twoHandedWeapon, rightHandWeapon, attackSound, flame, raise, ascend, spinning, body: settings },
  { impactAt, ...options } = {}) {
  const mesh = loadedModel(model)
  const animations = mesh.userData.animations ?? []
  const body = new Character({ size: modelSize(mesh), actions: clipLengths(animations, animDict), ...settings, ...options })
  const view = new CharacterModel(body, { mesh, animations, animDict, attackSound, flame, raise, ascend, spinning, impactAt,
    twoHandedWeapon: twoHandedWeapon && loadedModel(twoHandedWeapon),
    rightHandWeapon: rightHandWeapon && loadedModel(rightHandWeapon) })
  return { body, model: view }
}
