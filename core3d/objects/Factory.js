import * as THREE from 'three'
import Building from './Building.js'
import { loadedModel } from '/core3d/assets/models.js'

const { randFloat } = THREE.MathUtils

const model = { file: 'building/factory/model.fbx', size: 25 }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class Factory extends Building {
  constructor({ mesh = loadedModel(model), ...rest } = {}) {
    super({ mesh, name: 'factory', ...rest })
    this.smokeMin = randFloat(-this.height, -this.height * .75)
    this.addSmoke()
  }

  addSmoke() {
    const promise = import('/core3d/Particles.js')
    promise.then(obj => {
      this.smoke = new obj.BigSmoke()
      this.add(this.smoke.mesh)
      this.smoke.mesh.position.y += 28
      this.smoke.mesh.position.x += 13
    })
  }

  update(delta, t) {
    super.update()
    this.smoke?.update(delta, t, { min: this.smokeMin, max: 0 })
  }
}