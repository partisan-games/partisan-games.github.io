import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround } from '/core3d/ground.js'
import { createMoonSphere, createBoxes, createCrate, createRustyBarrel, createMetalBarrel } from '/core3d/geometry/index.js'
import { hemLight } from '/core3d/light.js'
import { sample } from '/core3d/helpers.js'
import { createFirTree } from '/core3d/geometry/trees.js'
import { createWarehouse, createWarehouse2, createWarRuin, createRuin, createAirport } from '/core3d/city.js'
import { leaveTracks } from '/core3d/physics/leaveTracks.js'
import Tank from '/core3d/physics/Tank.js'
import { baseControls } from '/ui/Controls.js'
import { BigSmoke, Fire } from '/core3d/Particles.js'
import { loadModel } from '/core3d/loaders.js'
import { GermanMachineGunnerAI } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { SSSoldierAI } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { NaziOfficerAI } from '/core3d/actor/derived/ww2/NaziOfficer.js'

const { randFloat } = THREE.MathUtils

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...baseControls, Space: 'break' },
      reportText: 'The enemy has erected barricades to block our entry into the city. Destroy them to clear the way for our troops.',
      intro: 'Demolish enemy barricades.',
    })
  }

  async init() {
    hemLight({ intensity: Math.PI * 1.25, scene: this.scene })

    this.world = new PhysicsWorld({ scene: this.scene })

    this.ground = createGround({ color: 0x509f53 })
    this.world.add(this.ground, 0)

    const crates = createBoxes({ width: 18, height: 3, depth: 1 })
    crates.forEach(mesh => this.world.add(mesh, 20))
    this.countableCrates = crates.filter(mesh => mesh.position.y > .5)

    for (let i = 0; i < 20; i++) {
      const mesh = createFirTree()
      mesh.position.set(randFloat(10, 50), 0, randFloat(-50, 50))
      this.world.add(mesh, 0)
    }

    const createObject = [createCrate, createRustyBarrel, createMetalBarrel, createMoonSphere]
    for (let i = 0; i < 30; i++) {
      const mesh = sample(createObject)({ translateHeight: false })
      mesh.position.set(randFloat(-10, -50), 0, randFloat(-30, 30))
      this.world.add(mesh, 10)
    }

    const createBuilding = [createRuin, createWarehouse, createWarehouse2, createWarRuin, createAirport]
    for (let i = -1; i < 5; i++)
      for (let j = 0; j < 3; j++) {
        const warehouse = sample(createBuilding)()
        warehouse.position.set(-i * 30, 0, j * 30 + 60)
        this.world.add(warehouse, 0)
      }

    this.player = new Tank({ physicsWorld: this.world.physicsWorld, camera: this.camera, pos: { x: 0, y: 1, z: -20 } })
    this.add(this.player)

    const destroyedTank = await loadModel({ file: 'tank/panzer-III-highpoly/model.fbx', size: 4 })
    destroyedTank.position.set(-30, 0, 10)
    this.addMesh(destroyedTank)

    this.smoke = new BigSmoke()
    this.smoke.mesh.position.set(-30, 2, 10)
    this.addMesh(this.smoke.mesh)

    this.fire = new Fire()
    this.fire.mesh.position.set(0, 10, 50)
    this.addMesh(this.fire.mesh)

    this.enemies = []
    ;[GermanMachineGunnerAI, SSSoldierAI, SSSoldierAI, NaziOfficerAI].forEach(AIClass => {
      const soldier = new AIClass({ pos: [0, 0, 20], target: this.player.mesh })
      this.enemies.push(soldier)
      this.add(soldier)
    })
  }

  update(dt, t) {
    super.update(dt)

    if ((this.player.input.left || this.player.input.right) && this.player.speed >= 30)
      leaveTracks({ body: this.player.body, wheelMeshes: this.player.wheelMeshes, ground: this.ground, scene: this.scene })

    this.world.update(dt)
    this.smoke?.update({ delta: dt })
    this.fire?.update({ delta: dt })

    this.countableCrates.forEach(mesh => {
      if (mesh.position.y <= 0.5)
        this.countableCrates.splice(this.countableCrates.findIndex(c => c === mesh), 1)
    })

    this.enemies.forEach(enemy => {
      enemy.damageAmount = enemy.distanceTo(this.player.mesh) < 1.5 ? 100 : 0
    })

    if (!this.countableCrates.length)
      this.victory(`You demolished enemy barricades in ${Math.floor(t)} seconds.`)
  }

  sceneUI(t) {
    return /* html */`
      <div class="top-left">
        Blocks left: ${this.countableCrates.length}
        <br><small class="blink">Time: ${Math.floor(t)}</small>
      </div>
    `
  }
}
