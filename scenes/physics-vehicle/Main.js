import * as THREE from 'three'
import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { getHeightData } from '/core3d/terrain/heightmap.js'
import { createTerrain } from '/core3d/physics/index.js'
import { createSphere, createTremplin } from '/core3d/geometry/index.js'
import Humvee, { models as humveeModels } from '/core3d/physics/Humvee.js'
import { requestModels } from '/core3d/assets/models.js'

const { randFloatSpread } = THREE.MathUtils

export default class PhysicsVehicleScene extends Scene3D {
  constructor() {
    super({ toon: true })
  }

  async init() {
    await requestModels([...humveeModels])
    this.physics = new PhysicsWorld({ scene: this.scene })
    this.session.scope.add(() => this.physics.dispose())

    this.addMesh(createSun({ planetColor: 0xB0E0E6 }))

    const { data, width, depth } = await getHeightData('/assets/images/heightmaps/wiki.png', 5)
    const terrain = await createTerrain({ data, width, depth, minHeight: -2, maxHeight: 16, own: this.physics.own })
    this.physics.add(terrain)

    const tremplin = createTremplin({ color: 0xfffacd })
    tremplin.position.set(-10, -4.5, 20)
    this.physics.add(tremplin, 0)

    for (let i = 0; i < 5; i++) {
      const ball = createSphere({ color: 0xfffacd })
      ball.position.set(randFloatSpread(40), 0, randFloatSpread(40))
      this.physics.add(ball, 800)
    }

    this.vehicle = new Humvee({ camera: this.camera, world: this.physics })
    this.add(this.vehicle)
    this.addMesh(...this.vehicle.wheelMeshes)
  }

  update(dt, t) {
    super.update(dt, t)
    this.physics?.update(dt)

    if (this.vehicle.isFlipped) this.defeat()
  }
}
