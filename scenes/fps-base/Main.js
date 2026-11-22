import Scene3D from '/core/Scene3D.js'
import { createGround } from '/core3d/ground.js'
import { sample, getHeight } from '/core3d/helpers.js'
import { hemLight, lightningStrike } from '/core3d/light.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
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
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'

const cellSize = 5

export default class FpsBaseScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      usePointerLock: true,
      controlKeys: fpsControls,
      intro: '<ul><li>Find the way out</li><li>Bonus: Kill all enemies</li></ul>',
      reportText: 'After the battle for Tuzla you remained behind enemy lines.\n\nFind the way out of the enemy base.',
    })
  }

  async init() {
    await requestModels([...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanFlameThrowerModels, ...germanSoldierModels, ...firstAidModels])
    this.backgroundColor = 0x301934
    this.light = hemLight({ intensity: Math.PI * 1.5, scene: this.scene })
    this.addMesh(createGround({ file: 'terrain/snow.jpg' }))

    this.maze = new Maze({ rows: 8, columns: 8, algorithm: truePrims, cellSize })
    const walls = this.maze.toTiledMesh({ texture: 'terrain/concrete.jpg' })
    this.addMesh(walls)

    const coords = this.maze.getEmptyCoords(true, cellSize - 1)
    const enemyWorld = worldQueries(walls)
    // the player also bumps into the crates and barrels set about later
    const playerSolids = [walls]
    const { impactAt, ...playerWorld } = worldQueries(playerSolids)
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
      const { x, z } = coords.pop()
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
      playerSolids.push(mesh)

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

    if (Math.random() > .998) lightningStrike(this.light, this.scene, this.session.presentation)
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
