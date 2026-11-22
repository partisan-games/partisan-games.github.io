const body = { file: 'aircraft/airplane/bomber-lancaster/model.glb', size: 3 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

/** How it looks, for a warplane made of a body and its model. */
export const description = { model: body }
