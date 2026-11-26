import { loadedModel } from '/core3d/assets/models.js'

/**
 * The houses and ruins of a small town of the 1940s, each `height` metres from its ground to its ridge or broken top;
 * the models come all of one size, so this gives them theirs. One `obj` comes with its materials beside it.
 */
export const townHouses = {
  'rock-house': { name: 'Kamena kuća', height: 5.5 },
  'simple-house': { name: 'Prizemnica od kamena', height: 6.5 },
  'old-house': { name: 'Stara kuća', height: 5.5 },
  'common-house': { name: 'Kuća', height: 6 },
  house: { name: 'Kuća sa tremom', height: 6 },
  cornershop: { name: 'Kuća sa radnjom', height: 9 },
  'storey-house': { name: 'Spratnica', height: 9 },
  building: { name: 'Zgrada', height: 10, obj: true },
  apartment: { name: 'Stambena zgrada', height: 13 },
  'european-building': { name: 'Gradska zgrada', height: 13 },
  cabin: { name: 'Brvnara', height: 5 },
  'ruins-building': { name: 'Ruševina zgrade', height: 9 },
  'ruined-building': { name: 'Porušena kuća', height: 6 },
}

/** What to load for one `kind` of `townHouses`. */
export function modelOf(kind) {
  const { height, obj } = townHouses[kind]
  const path = `building/town/${kind}/${kind}`
  const model = { file: `${path}.${obj ? 'obj' : 'fbx'}`, size: height, fitVisible: true, receiveShadow: true }
  return obj ? { ...model, mtl: `${path}.mtl` } : model
}

/** What to load; a game awaits requestModels(models) before it makes a house. */
export const models = Object.keys(townHouses).map(modelOf)

/** A house of `kind`, one of `townHouses`, standing on the ground at its middle, its front toward +z. */
export default class TownHouse {
  constructor(kind) {
    this.kind = kind
    this.mesh = loadedModel(modelOf(kind)).clone(true)
  }
}
