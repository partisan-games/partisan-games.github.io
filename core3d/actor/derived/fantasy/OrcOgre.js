const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  run: 'Mutant Run',
  attack: 'Mutant Swiping',
  attack2: 'Zombie Attack',
  // special: 'Zombie Scream',
  pain: 'Zombie Reaction Hit',
  death: 'Zombie Dying',
}

const meshModel = { file: 'model.fbx', prefix: 'character/orc-ogre/', animDict, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
