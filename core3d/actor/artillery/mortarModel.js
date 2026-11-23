import { loadedModel } from '/core3d/assets/models.js'

export const model = { file: 'weapon/mortar-81-mod35/model.glb', scale: 1 }
export const roundModel = { file: 'weapon/mortar-81-mod35/round.glb', scale: 1 }
export const models = [model, roundModel]

/** A fresh instance of the prepared prop; its Muzzle node follows the tube's direction. */
export const makeMortar = () => loadedModel(model).clone()
export const makeRound = () => loadedModel(roundModel).clone()
