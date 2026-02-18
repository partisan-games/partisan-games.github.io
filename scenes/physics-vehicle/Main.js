import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { getHeightData } from '/core3d/terrain/heightmap.js'
import { createTerrain } from '/core3d/physics/index.js'
import { createSphere, createTremplin } from '/core3d/geometry/index.js'
import Humvee from '/core3d/physics/Humvee.js'

const { randFloatSpread } = THREE.MathUtils

export default class extends Scena3D {
  constructor() {
    super({ toon: true })
  }

  async init() {
    this.world = new PhysicsWorld({ scene: this.scene })

    this.addMesh(createSun({ planetColor: 0xB0E0E6 }))

    const { data, width, depth } = await getHeightData('/assets/images/heightmaps/wiki.png', 5)
    const terrain = await createTerrain({ data, width, depth, minHeight: -2, maxHeight: 16 })
    this.world.add(terrain)

    const tremplin = createTremplin({ color: 0xfffacd })
    tremplin.position.set(-10, -4.5, 20)
    this.world.add(tremplin, 0)

    for (let i = 0; i < 5; i++) {
      const ball = createSphere({ color: 0xfffacd })
      ball.position.set(randFloatSpread(40), 0, randFloatSpread(40))
      this.world.add(ball, 800)
    }

    this.vehicle = new Humvee({ camera: this.camera, physicsWorld: this.world.physicsWorld })
    this.add(this.vehicle)
    this.addMesh(...this.vehicle.wheelMeshes)
  }

  /* LOOP */

  update(dt, t) {
    super.update(dt, t)
    this.world?.update(dt)

    if (this.vehicle.isFlipped) this.defeat()
  }
}
