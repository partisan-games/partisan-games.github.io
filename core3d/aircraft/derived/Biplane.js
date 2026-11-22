const body = { file: 'aircraft/airplane/biplane-bristol-f2b/model.fbx', size: 2.5 }
const propeller = { file: 'item/propeller/model.fbx', size: 1.5, angle: Math.PI }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body, propeller]

// aircraft/airplane/biplane-sopwith/model.fbx
// aircraft/airplane/biplane-bristol-f2b/model.fbx

/** How it looks, for a warplane made of a body and its model. */
export const description = { model: body, propeller }
