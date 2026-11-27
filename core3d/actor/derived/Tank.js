import renaultTracks from './RenaultTracks.js'
import tankCondition from './tankCondition.js'

const meshModel = { file: 'tank/renault-ft/textured.fbx', texture: 'vehicles/renault-ft-base.webp', size: 2.5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** The barrel is part of the Renault mesh. Its report and flash coincide with the body's shot. */
export const description = { model: meshModel, animDict: {},
  partMotion: tankCondition(renaultTracks, 'vehicles/renault-ft-plates.webp'), deathPose: 'armor',
  attackSound: 'cannon-shot.mp3', attackProfile: 'cannon',
  flame: { kinds: ['attack'], fromBlow: true, muzzle: [0, 1.95, -1.486], duration: .12 },
  body: { speed: 2, health: 1000, reach: 40, strikeHeight: .78, strikeAhead: 1.486, actions: { attack: .8 } } }
