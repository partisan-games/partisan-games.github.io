import * as THREE from 'three'
import Building from './Building.js'
import { loadModel } from '/core3d/loaders.js'

const { randFloat } = THREE.MathUtils

const mesh = await loadModel({ file: 'building/factory/model.fbx', size: 25 })

export default class Factory extends Building {
  constructor(rest) {
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

  update(delta) {
    super.update()
    this.smoke?.update({ delta, min: this.smokeMin, max: 0 })
  }
}