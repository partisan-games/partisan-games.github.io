// the model has its nose along +z; turned, it faces ahead, as the game flies it; its height, propeller and all, makes
// its wingspan the real 11.23 m
const body = { file: 'aircraft/supermarine-spitfire/model.glb', size: 3.72, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

/** How it looks, for a warplane made of a body and its model, and what it really was: a Supermarine Spitfire. */
export const description = { model: body, propellerNames: ['Object001'] }
