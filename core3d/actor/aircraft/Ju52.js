import { loadedModel } from '/core3d/assets/models.js'
import { Group, Vector3 } from 'three'
import { Smoke } from '/core3d/Particles.js'

export const ju52Model = {
  file: 'aircraft/ju52/model.glb',
  size: 5.8,
  fitVisible: true,
  receiveShadow: true,
}

export const models = [ju52Model]

/** The transport's view: +X is its nose; the body owns flight, dropping and the fall. */
export default class Ju52 {
  constructor(body) {
    this.body = body
    this.mesh = new Group()
    const figure = loadedModel(ju52Model).clone(true)
    figure.position.y = -body.size.height / 2
    this.mesh.add(figure)
    this.propellers = []
    figure.updateMatrixWorld(true)
    const blades = []
    figure.traverse(part => {
      if (part.isMesh && part.name.toLowerCase().includes('propeller')) blades.push(part)
    })
    for (const blade of blades) {
      const { parent } = blade
      const center = blade.localToWorld(new Vector3(...blade.userData.axle))
      const pivot = new Group()
      pivot.position.copy(parent.worldToLocal(center))
      parent.add(pivot)
      pivot.attach(blade)
      this.propellers.push(pivot)
    }
    this.place()
  }

  place() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.y, body.z)
    mesh.rotation.set(body.roll, body.yaw, body.pitch, 'YZX')
  }

  update(dt, t) {
    const { body } = this
    this.place()
    if (body.alive && body.state !== 'idle')
      this.propellers.forEach(pivot => pivot.rotateX(-30 * dt))
    if ((body.hitsTaken || body.dead) && !this.smoke) {
      this.smoke = new Smoke({ num: 120, size: .65 })
      this.smoke.mesh.rotation.set(0, 0, -Math.PI / 2)
      this.smoke.mesh.position.set(body.size.length * .25, 0, body.size.width * .13)
      this.mesh.add(this.smoke.mesh)
    }
    this.smoke?.update(dt, t, { min: -8, max: 0, rotateY: 0 })
  }
}
