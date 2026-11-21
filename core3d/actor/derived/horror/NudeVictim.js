const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Drunk Run Forward',
  run: 'Drunk Run Forward',
  attack: 'Terrified',
  special: 'Zombie Agonizing',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

// BUG: model is not centered
export const model = { file: 'model.fbx', size: 1.75, prefix: 'character/nude-victim/', animDict, angle: Math.PI }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model, animDict, body: { run: 1 } }
