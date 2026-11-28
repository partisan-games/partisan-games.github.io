import Scene3D from '/core/Scene3D.js'
import { skyGradients } from '/core/constants.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround, grassColor } from '/core3d/ground.js'
import { hemLight } from '/core3d/light.js'
import { leaveTracks } from '/core3d/physics/leaveTracks.js'
import Tank, { models as tankModels } from '/core3d/physics/Tank.js'
import TankGun from '/core3d/physics/TankGun.js'
import TankGunModel from '/core3d/physics/TankGunModel.js'
import { baseControls } from '/ui/Controls.js'
import { BigSmoke, Fire } from '/core3d/Particles.js'
import { buildKraljevo, kraljevo, posts, defence, models as kraljevoModels } from './kraljevo.js'
import { buildValley, models as valleyModels } from './valley.js'
import { description as germanMachineGunner, models as germanMachineGunnerModels } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { description as ssSoldier, models as ssSoldierModels } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { description as naziOfficer, models as naziOfficerModels } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { description as germanSoldier, models as germanSoldierModels } from '/core3d/actor/derived/ww2/GermanSoldier.js'
import { requestModels } from '/core3d/assets/models.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import meshTarget from '/core3d/actor/characters/meshTarget.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import NearestTarget from '/core/gameplay/controllers/NearestTarget.js'
import Escort, { escort } from '/core/gameplay/controllers/Escort.js'
import { description as partisan, models as partisanModels } from '/core3d/actor/derived/ww2/Partisan.js'
import { description as partisanLowpoly, models as partisanLowpolyModels } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { description as resistanceFighter, models as resistanceFighterModels } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { description as chetnik, models as chetnikModels } from '/core3d/actor/derived/ww2/Chetnik.js'
import { description as chetnikSubara, models as chetnikSubaraModels } from '/core3d/actor/derived/ww2/ChetnikSubara.js'
import { computerDamage } from '/core/gameplay/damage.js'

const formation = [
  { description: partisan, ahead: 4, side: -4 },
  { description: partisanLowpoly, ahead: 4, side: 4 },
  { description: resistanceFighter, ahead: 8, side: -7 },
  { description: chetnik, ahead: 8, side: 7 },
  { description: chetnikSubara, ahead: 1.5, side: -3 },
]

const defenders = { machineGun: germanMachineGunner, rifle: germanSoldier, officer: naziOfficer, ss: ssSoldier }

export default class Tank3DScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...baseControls, Space: 'fire' },
      reportText: 'Kraljevo, October 1941\n\nPartisans and Chetniks besiege the German garrison in Kraljevo. Two captured tanks join the final assault.',
      intro: 'Break through the German defence to the town centre. Protect your comrades at all costs.',
      canvasBackground: skyGradients.modra,
    })
  }

  async init() {
    await requestModels([...tankModels, ...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanSoldierModels,
      ...partisanModels, ...partisanLowpolyModels, ...resistanceFighterModels, ...chetnikModels, ...chetnikSubaraModels,
      ...kraljevoModels, ...valleyModels])
    hemLight({ intensity: Math.PI * 1.25, scene: this.scene })

    this.physics = new PhysicsWorld({ scene: this.scene })
    this.session.scope.add(() => this.physics.dispose())

    this.ground = createGround({ color: grassColor })
    this.physics.add(this.ground, 0)

    await buildKraljevo(this.physics)
    buildValley(this.physics)

    // a tank has no jump, so it fires on Space and brakes by driving back
    this.player = new Tank({ world: this.physics, camera: this.camera, pos: { x: 0, y: 1, z: -40 }, attackKey: 'Space' })
    this.add(this.player)

    // a house in the street burns at its door
    this.smoke = new BigSmoke()
    this.smoke.mesh.position.set(-12, 6, 150)
    this.addMesh(this.smoke.mesh)

    this.fire = new Fire()
    this.fire.mesh.position.set(-8.5, 1, 150)
    this.addMesh(this.fire.mesh)

    // The soldiers' bullets do not harm the tank; its escort can fall.
    const tank = meshTarget(this.player.mesh, { facesPositiveZ: true })
    this.enemies = []
    // ahead of the tank and to its sides, where the camera behind it sees them
    this.comrades = formation.map(({ description, ...place }) => {
      // they run 6 m/s, as fast as a man can, to keep up with the tank
      const { body, model } = makeCharacter(description,
        { speed: 3, reach: escort.sight, targets: this.enemies, damage: computerDamage })
      const guard = new Escort(body, { leader: tank, enemies: this.enemies, place })
      Object.assign(body, guard.post)
      this.controllers.push(guard)
      this.add(body, model)
      return body
    })
    const germanTargets = [tank, ...this.comrades]
    // each holds his post, facing down the road (-z), and fires on what comes into reach
    for (const { arm, kind = arm, ...post } of posts) {
      const { body, model } = makeCharacter(defenders[kind], { ...post, ...defence[arm], yaw: Math.PI / 2, targets: germanTargets })
      const ai = new CharacterAI(body, { target: tank, way: 'defend', sight: defence[arm].reach })
      // Each picks the nearest of the tank and its escort before it decides what to do.
      this.controllers.push(new NearestTarget(ai, { candidates: germanTargets }), ai)
      this.add(body, model)
      this.enemies.push(body)
    }
    const gun = new TankGun({ tank: this.player, world: this.physics, targets: this.enemies, clock: this.session.clock })
    this.add(gun, new TankGunModel(gun))
  }

  update(dt, t) {
    super.update(dt)

    if ((this.player.input.left || this.player.input.right) && this.player.speed >= 30)
      leaveTracks({ body: this.player.body, wheelMeshes: this.player.wheelMeshes, ground: this.ground, scene: this.scene })

    this.physics.update(dt)
    this.smoke?.update(dt, t)
    this.fire?.update(dt, t)

    // a soldier the tank drives over dies
    const { x, z } = this.player.mesh.position
    this.enemies.forEach(enemy => {
      if (Math.hypot(enemy.x - x, enemy.z - z) < 1.5) enemy.takeHit(100)
    })

    // the town centre is the square; without the men who go with it, the tank cannot take the town
    if (Math.hypot(x, z - kraljevo.square.z) < kraljevo.square.radius) this.victory('You broke through to the town centre.')
    if (this.comrades.every(comrade => comrade.dead)) this.defeat('Your comrades have fallen. The tank cannot take the town alone.')
  }

  sceneUI() {
    return this.ui.scoreUI('Comrades', this.comrades.filter(comrade => !comrade.dead).length)
  }
}
