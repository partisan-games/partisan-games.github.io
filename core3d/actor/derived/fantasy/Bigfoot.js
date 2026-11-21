const animDict = {
  idle: 'Goalkeeper Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Punching',
}

const meshModel = { file: 'model.fbx', prefix: 'character/bigfoot/', angle: Math.PI, animDict }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, body: {} }
