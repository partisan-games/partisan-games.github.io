const animDict = {
  idle: 'Warrior Idle',
  walk: 'Walk',
  death: 'Dying',
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'resistance-fighter.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
export const models = [model]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model, animDict, body: {} }
