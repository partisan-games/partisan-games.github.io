import Character from '/core/gameplay/bodies/characters/Character.js'
import { loadedModel } from '/core3d/assets/models.js'
import CharacterModel, { clipLengths, modelSize } from './CharacterModel.js'

export function makeCharacterBody(mesh, animDict, settings, options) {
  const actions = clipLengths(mesh.userData.animations ?? [], animDict)
  return new Character({ size: modelSize(mesh), actions, ...settings, ...options })
}

/**
 * A character from its module's `description`, once its models are loaded: a body as big as its model, its actions
 * as long as its clips, and the model that shows it. `options` are the body's, as where it stands and what it hits;
 * `impactAt` is the view's query for a bullet's mark on the world, and `ground` what its steps sound on.
 */
export default function makeCharacter({ model, animDict, twoHandedWeapon, rightHandWeapon, attackSound, attackProfile, flame, raise, deathPose, dress, partMotion, body: settings },
  { impactAt, ground, ...options } = {}) {
  const mesh = loadedModel(model)
  const animations = mesh.userData.animations ?? []
  const body = makeCharacterBody(mesh, animDict, settings, options)
  const view = new CharacterModel(body, { mesh, animations, animDict, attackSound, attackProfile, flame, raise, deathPose, impactAt, partMotion, ground,
    twoHandedWeapon: twoHandedWeapon && loadedModel(twoHandedWeapon),
    rightHandWeapon: rightHandWeapon && loadedModel(rightHandWeapon) })
  dress?.(view.mesh)
  return { body, model: view }
}
