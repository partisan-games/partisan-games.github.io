const animDict = { idle: 'Ginga', walk: 'Dwarf Walk', run: 'Fast Run', attack: 'Benção', jump: 'Aú sem mão' }
export const model = { prefix: 'character/huntress/', file: 'capoeira-girl.fbx', animDict, axis: [0, 1, 0], angle: Math.PI }

/** How she looks and acts, for a character made of a body and its model. */
export const description = { model, animDict, body: {} }
