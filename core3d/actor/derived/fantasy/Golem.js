const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Mutant Walking',
  attack: 'Zombie Kicking',
  attack2: 'Mutant Swiping',
  pain: 'Zombie Reaction Hit',
  death: 'Standing Death Forward 01',
}

/** What to load; a game awaits requestModel(model) in init(), before it creates a golem. */
export const model = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/golem/', size: 2.5 }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model, animDict, body: {} }
