const animDict = {
  idle: 'Unarmed Idle',
  walk: 'Drunk Run Forward',
  run: 'Drunk Run Forward',
  special: 'Terrified',
  pain: 'Zombie Agonizing',
  death: 'Dying',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'model.fbx', size: 1.75, prefix: 'character/nude-victim/', animDict, angle: Math.PI,
  sharedClips: { Dying: 'character/soldier/Dying.fbx' } }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model, animDict, body: { run: 1 } }
