import { loadModel } from '/core3d/loaders.js'

/**
 * Prepared models, shared by every game on the page. A model module only describes its model;
 * the model loads on the first request, never on import, and every later request gets the same load.
 * A failed load is forgotten, so the next request tries again.
 *
 * The cache keeps the prepared model in memory for the page's life, as the old model modules did.
 * Instances are clones in a game's scene, and `Scena3D.disposeScene` frees what they hold on the
 * graphics card; a model drawn again later is uploaded again. The cache never frees anything itself.
 */
const loads = new Map()
const loaded = new Map()

// the whole description: one file prepared at two sizes (a propeller on different planes) is two models
const keyOf = model => JSON.stringify(Object.keys(model).sort().map(key => [key, model[key]]))

/** Loads the described model once; resolves with its prepared mesh. */
export function requestModel(model) {
  const key = keyOf(model)
  if (!loads.has(key)) {
    const load = loadModel({ ...model }) // loadModel rewrites the file of the object it gets
      .then(mesh => {
        loaded.set(key, mesh)
        return mesh
      }, error => {
        loads.delete(key)
        throw error
      })
    loads.set(key, load)
  }
  return loads.get(key)
}

export const requestModels = models => Promise.all(models.map(requestModel))

/** The prepared mesh of a model that has finished loading; a class constructor clones it. */
export function loadedModel(model) {
  const mesh = loaded.get(keyOf(model))
  if (!mesh) throw new Error(`Model ${model.prefix ?? ''}${model.file} is used before it has loaded; await requestModel() in init()`)
  return mesh
}
