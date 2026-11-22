const animDict = {
  idle: 'Crouch Idle',
  walk: 'Crouched Walking',
  run: 'Run',
  attack: 'Standing 2H Magic Attack 01',
  attack2: 'Spell Casting',
  special: 'Zombie Scream',
  death: 'Crouch Death',
}

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/witch/', size: 1.7,
  sharedClips: { 'Crouch Death': 'character/soldier/Crouch Death.fbx' } }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model: flame pours from her spell as it lands. */
export const description = { model: meshModel, animDict, flame: { fromBlow: true }, body: { reach: 3 } }
