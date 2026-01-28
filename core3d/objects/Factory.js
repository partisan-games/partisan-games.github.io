import { loadModel } from '/core3d/loaders.js'
import Building from './Building.js'

const mesh = await loadModel({ file: 'building/factory/model.fbx', size: 25 })

export default class Factory extends Building {
  constructor(rest) {
    super({ mesh, name: 'factory', ...rest })
  }
}