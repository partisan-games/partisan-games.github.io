const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Attack',
  pain: 'Shove Reaction',
  death: 'Mutant Dying',
}

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/troll/', size: 3 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
