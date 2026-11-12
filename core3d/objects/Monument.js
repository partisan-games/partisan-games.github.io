import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'building/monument/knight/knight.fbx', size: 15, shouldAdjustHeight: true, shouldCenter: true }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class Monument extends GameObject {
  constructor(params = {}) {
    super({ mesh: loadedModel(model), ...params })
  }
}