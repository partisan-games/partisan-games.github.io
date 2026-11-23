const model = { file: 'weapon/cannon/field-gun-75.glb', scale: 1 }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

/** The field gun turns in place and starts with the barrel raised toward the terrace; it stays standing when its crew falls. */
export const description = {
  model, animDict: {}, deathPose: 'intact', body: { speed: .5, walks: false, pitch: .2, pitchRange: { min: .025, max: .6 } },
}

/** How fast the barrel rises and sinks, in radians a second. */
export const aimRate = .3
