import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import Input from '/core/io/Input.js'
import makeCharacter from './makeCharacter.js'
import CharacterChase from './CharacterChase.js'

/**
 * Puts the character a player leads into `scene`, made from its `description`; the other options are its body's.
 * See `lead` for `input` and `view`. Gives the body, the model, the chase and the keys.
 */
export default function leadCharacter(scene, description, { input, view, ...options } = {}) {
  return lead(scene, makeCharacter(description, options), { input, view })
}

/**
 * Puts a made character a player leads into `scene`: led by keys from an `Input` made with `input`, heard from where
 * it stands, and seen through the scene's camera chasing it, with `view` as the chase's options. The keys come first,
 * so their touch buttons come before the camera button in the page, and the page's style lifts that button above them.
 */
export function lead(scene, { body, model }, { input = {}, view = {} } = {}) {
  const keys = new CharacterKeys(body, new Input(input))
  const chase = new CharacterChase(body, model, { camera: scene.camera, ...view })
  scene.controllers.push(keys)
  scene.audioPlayer = () => model
  scene.add(body, model, chase)
  return { body, model, chase, keys }
}
