import { loadedModel } from '/core3d/assets/models.js'

/** Trees of the countryside, each its model at its real `size`, its height in metres. */
export const trees = {
  linden: { name: 'Lipa', model: { file: 'nature/trees/linden.glb', size: 12, fitVisible: true } },
  oak: { name: 'Hrast', model: { file: 'nature/trees/oak.glb', size: 10, fitVisible: true } },
  'burnt-oak': { name: 'Nagoreli hrast', model: { file: 'nature/trees/burnt-oak.glb', size: 7, fitVisible: true } },
}

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
