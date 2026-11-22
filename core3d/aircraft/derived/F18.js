const body = { file: 'aircraft/airplane/f18/model.fbx', size: 3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

// dodati potisak

/** How it looks, for a warplane made of a body and its model. */
export const description = { model: body }
