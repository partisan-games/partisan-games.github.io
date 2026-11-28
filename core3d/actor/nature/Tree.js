import { loadedModel } from '/core3d/assets/models.js'

/** Trees of the countryside, each its model at its real `size`, its height in metres. */
export const trees = {
  linden: { name: 'Lipa', model: { file: 'nature/trees/linden.glb', size: 12, fitVisible: true } },
  oak: { name: 'Hrast', model: { file: 'nature/trees/oak.glb', size: 10, fitVisible: true } },
  'burnt-oak': { name: 'Nagoreli hrast', model: { file: 'nature/trees/burnt-oak.glb', size: 7, fitVisible: true } },
  'willow-15': { name: 'Žalosna vrba, vitka', model: { file: 'nature/trees/willow-15/model.glb', scale: 1 } },
  'willow-04': { name: 'Žalosna vrba, niska', model: { file: 'nature/trees/willow-04/model.glb', scale: 1 } },
  'willow-06': { name: 'Žalosna vrba, visoka', model: { file: 'nature/trees/willow-06/model.glb', scale: 1 } },
  'willow-11': { name: 'Žalosna vrba, razgranata', model: { file: 'nature/trees/willow-11/model.glb', scale: 1 } },
}

/** The weeping willows, each its own shape, for a bank to plant them by turns. */
export const willows = Object.keys(trees).filter(kind => kind.startsWith('willow'))

/** What to load; a game awaits requestModels(models) before it plants a tree. */
export const models = Object.values(trees).map(({ model }) => model)

/** A tree of `kind`, one of `trees`, standing on the ground at its trunk. */
export default class Tree {
  constructor(kind) {
    this.kind = kind
    this.mesh = loadedModel(trees[kind].model).clone(true)
    // a toon scene's outline would draw each leaf card whole, as a black patch, for it knows no cut-out
    this.mesh.traverse(part => {
      if (part.material?.alphaTest) part.material.userData.outlineParameters = { visible: false }
    })
  }
}
