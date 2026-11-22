const animDict = {
  special: 'Zombie Scream',
  run: 'Flying',
  walk: 'Walking',
  idle: 'Zombie Idle',
  attack: 'Zombie Neck Bite',
  death: 'Zombie Death',
}

const meshModel = { file: 'model.fbx', prefix: 'character/skeleton/', angle: Math.PI, animDict,
  sharedClips: { 'Zombie Death': 'character/zombie/Zombie Death.fbx' } }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: { speed: 1.2 } }
