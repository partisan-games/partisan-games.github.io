import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

export const model = { file: 'nature/dead-tree/model.glb', size: 5 }
export const models = [model]

export default class DeadTree extends GameObject {
  constructor(params = {}) {
    super({ mesh: loadedModel(model), color: 0x362419, ...params })
  }
}