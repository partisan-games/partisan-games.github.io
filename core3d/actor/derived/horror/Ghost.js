const animDict = {
  idle: 'Take 001'
}

/* MODEL DESCRIPTION: the scene awaits requestModels(models) before construction. */

export const model = { file: 'character/ghost/scene.gltf', angle: Math.PI }
export const models = [model]

/**
 * How it looks and acts, for a character made of a body and its model: one walks through it, any spell that reaches it
 * kills it (owner, 2026-11-21), and dead, it spins and floats away.
 */
export const description = { model, animDict, ascend: true, body: { solid: false, health: 50 } }
