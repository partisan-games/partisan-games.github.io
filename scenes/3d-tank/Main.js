import * as THREE from 'three'
import Scene3D, { skyGradients } from '/core/Scene3D.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround, grassColor } from '/core3d/ground.js'
import { createMoonSphere, createBoxes, createCrate, createRustyBarrel, createMetalBarrel } from '/core3d/geometry/index.js'
import { hemLight } from '/core3d/light.js'
import { sample } from '/core3d/helpers.js'
import { createFirTree } from '/core3d/geometry/trees.js'
import { createWarehouse, createWarehouse2, createWarRuin, createRuin, createAirport } from '/core3d/city.js'
import { leaveTracks } from '/core3d/physics/leaveTracks.js'
import Tank, { models as tankModels } from '/core3d/physics/Tank.js'
import { baseControls } from '/ui/Controls.js'
import { BigSmoke, Fire } from '/core3d/Particles.js'
import { loadModel } from '/core3d/loaders.js'
import { description as germanMachineGunner, models as germanMachineGunnerModels } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { description as ssSoldier, models as ssSoldierModels } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { description as naziOfficer, models as naziOfficerModels } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { description as germanSoldier, models as germanSoldierModels } from '/core3d/actor/derived/ww2/GermanSoldier.js'
import { requestModels } from '/core3d/assets/models.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import meshTarget from '/core3d/actor/characters/meshTarget.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { computerDamage } from '/core/gameplay/damage.js'

const { randFloat } = THREE.MathUtils

export default class Tank3DScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...baseControls, Space: 'brake' },
      reportText: 'The enemy has erected barricades to block our entry into the city. Destroy them to clear the way for our troops.',
      intro: 'Demolish enemy barricades.',
      canvasBackground: skyGradients.modra,
    })
  }

  async init() {
    await requestModels([...tankModels, ...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanSoldierModels])
    hemLight({ intensity: Math.PI * 1.25, scene: this.scene })

    this.physics = new PhysicsWorld({ scene: this.scene })
    this.session.scope.add(() => this.physics.dispose())

    this.ground = createGround({ color: grassColor })
    this.physics.add(this.ground, 0)

    const crates = createBoxes({ width: 18, height: 3, depth: 1 })
    crates.forEach(mesh => this.physics.add(mesh, 20))
    this.countableCrates = crates.filter(mesh => mesh.position.y > .5)

    for (let i = 0; i < 20; i++) {
      const mesh = createFirTree()
      mesh.position.set(randFloat(10, 50), 0, randFloat(-50, 50))
      this.physics.add(mesh, 0)
    }

    const createObject = [createCrate, createRustyBarrel, createMetalBarrel, createMoonSphere]
    for (let i = 0; i < 30; i++) {
      const mesh = sample(createObject)({ translateHeight: false })
      mesh.position.set(randFloat(-10, -50), 0, randFloat(-30, 30))
      this.physics.add(mesh, 10)
    }

    const createBuilding = [createRuin, createWarehouse, createWarehouse2, createWarRuin, createAirport]
    for (let i = -1; i < 5; i++)
      for (let j = 0; j < 3; j++) {
        const warehouse = sample(createBuilding)()
        warehouse.position.set(-i * 30, 0, j * 30 + 60)
        this.physics.add(warehouse, 0)
      }

    this.player = new Tank({ world: this.physics, camera: this.camera, pos: { x: 0, y: 1, z: -20 } })
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

    // the soldiers' bullets do not harm the tank
    const tank = meshTarget(this.player.mesh)
    this.enemies = [germanMachineGunner, ssSoldier, germanSoldier, naziOfficer].map(description => {
      const { body, model } = makeCharacter(description, { z: 20, targets: [tank], damage: computerDamage })
      this.controllers.push(new CharacterAI(body, { target: tank, way: 'wander' }))
      this.add(body, model)
      return body
    })
  }

  update(dt, t) {
    super.update(dt)

    if ((this.player.input.left || this.player.input.right) && this.player.speed >= 30)
      leaveTracks({ body: this.player.body, wheelMeshes: this.player.wheelMeshes, ground: this.ground, scene: this.scene })

    this.physics.update(dt)
    this.smoke?.update(dt, t)
    this.fire?.update(dt, t)

    this.countableCrates.forEach(mesh => {
      if (mesh.position.y <= 0.5)
        this.countableCrates.splice(this.countableCrates.findIndex(c => c === mesh), 1)
    })

    // a soldier the tank drives over dies
    const { x, z } = this.player.mesh.position
    this.enemies.forEach(enemy => {
      if (Math.hypot(enemy.x - x, enemy.z - z) < 1.5) enemy.takeHit(100)
    })

    if (!this.countableCrates.length)
      this.victory(`You demolished enemy barricades in ${Math.floor(t)} seconds.`)
  }

  sceneUI(t) {
    return this.ui.scoreUI('Blocks left', this.countableCrates.length, 'Time', Math.floor(t), 'blink')
  }
}
