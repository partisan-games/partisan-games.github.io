const body = { file: 'aircraft/airplane/triplane-sopwith/triplane.fbx', size: 3 }
const propeller = { file: 'item/propeller/model.fbx', size: 1.5, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, propeller]

/** How it looks, for a warplane made of a body and its model. */
export const description = { model: body, propeller }
