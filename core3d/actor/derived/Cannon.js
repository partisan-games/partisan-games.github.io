const model = { file: 'weapon/cannon/civil-war-cannon.fbx', size: 1.5 }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

/**
 * How it looks and acts, for a character made of a body and its model: a gun on its carriage turns, slowly, but does
 * not walk; its barrel sinks so far that a full shot hits the lowest row of the wall in the game Cannon and rises so
 * far that one hits the top row, and starts at .245.
 */
export const description = {
  model, animDict: {}, body: { speed: .5, walks: false, pitch: .245, pitchRange: { min: -.04, max: .41 } },
}

/** The model's barrel, its tube and bands, which it draws raised .18 radians. */
export const barrel = { parts: ['Object_2', 'Object_4'], drawnAt: .18 }

/** How fast the barrel rises and sinks, in radians a second. */
export const aimRate = .3
