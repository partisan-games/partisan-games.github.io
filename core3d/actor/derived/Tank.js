const meshModel = { file: 'tank/renault-ft.fbx', texture: 'metal/metal01.jpg', size: 2.5 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks and acts, for a character made of a body and its model: a slow, heavy machine with no weapon of its own. */
export const description = { model: meshModel, animDict: {}, body: { speed: 2, health: 1000 } }
