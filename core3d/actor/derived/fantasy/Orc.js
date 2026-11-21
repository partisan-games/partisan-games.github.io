const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Orc Walk',
  // run: 'Unarmed Run Forward',
  attack: 'Zombie Attack',
  // attack2: 'Zombie Kicking',
  // special: 'Zombie Scream',
  pain: 'Zombie Reaction Hit',
  death: 'Death From The Back',
}

const meshModel = { file: 'model.fbx', prefix: 'character/orc/', animDict, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
