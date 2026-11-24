import Scene3D from '/core/Scene3D.js'
import { createGround } from '/core3d/ground.js'
import { sample, getHeight } from '/core3d/helpers.js'
import { hemLight } from '/core3d/light.js'
import { DirectionalLight, Fog, MeshStandardMaterial } from 'three'
import campLayout from './campLayout.js'
import CampEnvironment, { models as campModels } from './CampEnvironment.js'
import { description as germanMachineGunner, models as germanMachineGunnerModels } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { description as ssSoldier, models as ssSoldierModels } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { description as naziOfficer, models as naziOfficerModels } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { description as germanFlameThrower, models as germanFlameThrowerModels } from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import { description as germanSoldier, models as germanSoldierModels } from '/core3d/actor/derived/ww2/GermanSoldier.js'
import FirstAid, { models as firstAidModels } from '/core3d/objects/FirstAid.js'
import { fpsControls } from '/ui/Controls.js'
import { Snow, Smoke, FlameUp, Fire } from '/core3d/Particles.js'
import { createCrate, createRustyBarrel, createMetalBarrel, createPlayerBox } from '/core3d/geometry/index.js'
import { requestModels } from '/core3d/assets/models.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { computerDamage } from '/core/gameplay/damage.js'
import Input from '/core/io/Input.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'

export default class FpsBaseScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      usePointerLock: true,
      controlKeys: fpsControls,
      intro: '<ul><li>Find the way out</li><li>Bonus: Kill all enemies</li></ul>',
      reportText: 'Crveni Krst camp, Niš, February 1942. Your mission is to break out of the German camp and reach the partisans on Suva Planina.',
    })
  }

  async init() {
    await requestModels([...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanFlameThrowerModels,
      ...germanSoldierModels, ...firstAidModels, ...campModels], { parallelAnimations: true })
    this.backgroundColor = 0x202835
    this.scene.fog = new Fog(0x202835, 55, 125)
    this.light = hemLight({ intensity: 1.25, skyColor: 0x9cabcf, groundColor: 0x36332e, scene: this.scene })
    const moon = new DirectionalLight(0xb8caf0, 1.1)
    moon.position.set(-25, 45, 20)
    this.scene.add(moon)
    const ground = createGround({ file: 'terrain/snow.jpg', size: 130, circle: false })
    const previous = ground.material
    ground.material = new MeshStandardMaterial({ map: previous.map, color: 0xb7c2d2, roughness: 1 })
    previous.dispose()
    this.addMesh(ground)

    this.layout = campLayout()
    this.maze = this.layout.maze
    this.camp = new CampEnvironment(this.layout)
    this.add(this.camp)
    const coords = [...this.layout.spawnPoints]
    const enemyWorld = this.camp.queries()
    const { impactAt, ...playerWorld } = this.camp.queries()
    this.player = new Character({ ...this.maze.tilePosition(1, 1), size: { length: .4, height: 1.78, width: .4 },
      reach: 100, jumping: 'fly', strikeHeight: .82, ...playerWorld })
    this.player.face({ x: 0, z: 0 })
    this.controllers.push(new CharacterKeys(this.player, new Input({ useJoystick: false, useKeyboard: true, attackKey: 'pointer' })),
      new MouseLook(this.player))
    const playerModel = new CharacterModel(this.player, { mesh: createPlayerBox({ visible: false }), attackSound: 'rifle.mp3', impactAt })
    this.audioPlayer = () => playerModel
    this.add(this.player, playerModel, new FirstPersonView(this.player, { camera: this.camera }))

    const soldiers = [germanMachineGunner, ssSoldier, naziOfficer, germanFlameThrower, germanSoldier]
    this.enemies = Array.from({ length: 10 }, () => {
      const index = coords.findIndex(point => Math.hypot(point.x - this.player.x, point.z - this.player.z) > 12)
      const { x, z } = coords.splice(index, 1)[0]
      const { body, model } = makeCharacter(sample(soldiers), { x, z, targets: [this.player], damage: computerDamage, ...enemyWorld })
      this.controllers.push(new CharacterAI(body, { target: this.player, way: 'wander', sees: enemyWorld.sees }))
      this.add(body, model)
      return body
    })
    this.player.targets = this.enemies

    this.firstAids = Array.from({ length: 2 }, () => {
      const firstAid = new FirstAid({ pos: coords.pop() })
      this.addMesh(firstAid.mesh)
      return firstAid
    })

    this.smokes = []
    const createObject = [createCrate, createRustyBarrel, createMetalBarrel]
    for (let i = 0; i < 10; i++) {
      const pos = coords.pop()
      const mesh = sample(createObject)({ pos })
      this.addMesh(mesh)
      mesh.updateMatrixWorld(true)
      this.camp.walkSolids.push(mesh)
      this.camp.opaqueSolids.push(mesh)

      if (i % 3 === 0) {
        const Effect = Math.random() > .5 ? Smoke : FlameUp
        this.smoke = new Effect({ pos })
        this.smoke.mesh.position.y += getHeight(mesh)
        this.addMesh(this.smoke.mesh)
        this.smokes.push(this.smoke)
      }
    }

    this.snow = new Snow()
    this.addMesh(this.snow.mesh)

    this.fire = new Fire({ pos: this.maze.exitPosition })
    this.addMesh(this.fire.mesh)
  }

  end() {
    super.end()
    this.enemies = []
  }

  update(dt, t) {
    super.update(dt, t)
    this.snow.update(dt, t)
    this.smokes.forEach(smoke => smoke.update(dt, t))
    this.fire.update(dt, t)
    this.healPlayer()
    const killed = this.enemies.filter(enemy => enemy.dead)
    const { x, z } = this.maze.exitPosition
    const won = Math.hypot(this.player.x - x, this.player.z - z) < 5

    if (won)
      this.victory(`You found a way out and kill ${killed.length} of ${this.enemies.length} enemies`)

    if (this.player.dead)
      this.defeat('You are dead.')

  }

  /** A first aid kit the hurt player stands by gives him a point of health a frame until it is used up. */
  healPlayer() {
    const { health } = this.player
    for (const firstAid of this.firstAids) {
      const { x, z } = firstAid.position
      if (Math.hypot(this.player.x - x, this.player.z - z) >= 1 || health.current === health.maximum || !firstAid.energy) continue
      firstAid.energy--
      health.heal(1)
      if (!firstAid.energy) this.removeMesh(firstAid.mesh)
    }
  }

  sceneUI() {
    const killed = this.enemies.filter(enemy => enemy.dead)
    const left = this.enemies.length - killed.length
    return this.ui.scoreUI('Score', killed.length, 'Enemy left', left)
  }
}
