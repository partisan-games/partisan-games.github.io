import { loadedModel } from '/core3d/assets/models.js'

export const churchModel = {
  file: 'building/drvar-church/church.glb',
  size: 11,
  fitVisible: true,
  receiveShadow: true,
}

export const models = [churchModel]

export default class Church {
  constructor() {
    this.mesh = loadedModel(churchModel).clone(true)
  }
}
