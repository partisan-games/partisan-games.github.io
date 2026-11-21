const model = { file: 'weapon/cannon/civil-war-cannon.fbx', size: 1.5 }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

/** How it looks and acts, for a character made of a body and its model: a gun on its carriage turns, slowly, but does not walk. */
export const description = { model, animDict: {}, body: { speed: .5, walks: false } }
