import Scene3D from '/core/Scene3D.js'
import { sample } from '/core3d/helpers.js'
import { hemLight } from '/core3d/light.js'
import { Box3, DirectionalLight, Fog, HemisphereLight, PerspectiveCamera, Scene } from 'three'
import campLayout from './campLayout.js'
import CampEnvironment, { models as campModels } from './CampEnvironment.js'
import { createCampGround, createCampHorizon, horizonColor } from './campTerrain.js'
import { description as germanMachineGunner, models as germanMachineGunnerModels } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { description as ssSoldier, models as ssSoldierModels } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { description as naziOfficer, models as naziOfficerModels } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { description as germanFlameThrower, models as germanFlameThrowerModels } from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import { description as germanSoldier, models as germanSoldierModels } from '/core3d/actor/derived/ww2/GermanSoldier.js'
import FirstAid, { models as firstAidModels } from '/core3d/objects/FirstAid.js'
import { fpsControls } from '/ui/Controls.js'
import { Snow, Fire } from '/core3d/Particles.js'
import { createCrate, createRustyBarrel, createMetalBarrel, createPlayerBox } from '/core3d/geometry/index.js'
import { requestModels } from '/core3d/assets/models.js'
import { computerDamage } from '/core/gameplay/damage.js'
import Input from '/core/io/Input.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import { icons } from '/core/io/icons.js'
import { isTouchScreen } from '/config.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import TouchLook from '/core3d/actor/characters/TouchLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'
import CampWeapons, { takeWeapon } from './CampWeapons.js'
import PrisonerAvatar, { prisonerModel } from './PrisonerAvatar.js'
import { CampGuard, PrisonerKeys, raiseAlarm } from './stealth.js'
import CampCompanion from './EscapingPrisoners.js'
import Prisoner from '/core/gameplay/bodies/characters/Prisoner.js'
import { keys } from '/core/io/keys.js'
import PrisonerModel, { PrisonerFootsteps, models as escapeModels, prisonerLooks } from '/core3d/actor/derived/ww2/Prisoner.js'
import CampNavigation from './CampNavigation.js'
import { texts } from '/scenes/texts.js'

const text = texts['crveni-krst']

const soldiers = [germanMachineGunner, ssSoldier, naziOfficer, germanFlameThrower, germanSoldier]
const halt = 'halt.mp3'
/** Everyone in the camp walks on snow. */
const footing = 'snow'
const shout = { group: 'speech', nearDistance: 4, fadeStart: 20, maxDistance: 32, farCutoff: 2500, maxVoices: 2 }

export default class FpsBaseScene extends Scene3D {
  constructor() {
    super({
      toon: 'soft',
      usePointerLock: true,
      controlKeys: { ...fpsControls, [keys.crouch.label]: 'hold to sneak', [takeWeapon.label]: 'take weapon' },
      intro: text.intro,
      reportText: 'Crveni Krst camp, Niš, 12 February 1942\n\nThe prisoners have planned their breakout. You have overpowered a guard and taken his rifle. Find a way out.',
    })
    this.viewRenderer = this.renderer
  }

  async init() {
    this.sceneAudio.output.preload(halt)
    await requestModels([...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanFlameThrowerModels,
      ...germanSoldierModels, ...firstAidModels, ...campModels, ...escapeModels, prisonerModel], { parallelAnimations: true })
    this.scene.background = createCampHorizon()
    this.scene.fog = new Fog(horizonColor, 55, 125)
    this.light = hemLight({ intensity: 1.25, skyColor: 0x9cabcf, groundColor: 0x36332e, scene: this.scene })
    const moon = new DirectionalLight(0xb8caf0, 1.1)
    moon.position.set(-25, 45, 20)
    this.scene.add(moon)
    this.layout = campLayout()
    this.maze = this.layout.maze
    this.addMesh(createCampGround(this.layout))
    this.camp = new CampEnvironment(this.layout)
    this.add(this.camp)
    const coords = [...this.layout.spawnPoints]
    const enemyWorld = this.camp.queries()
    const { impactAt, ...playerWorld } = this.camp.queries()
    this.player = new Prisoner({ ...this.maze.tilePosition(1, 1), size: { length: .4, height: 1.78, width: .4 },
      reach: 1.65, actions: { attack: .9 }, jumping: 'fly', strikeHeight: .89, ...playerWorld })
    this.player.face({ x: 0, z: 0 })
    // on a touch screen two more buttons stand for the keys to sneak and to take a weapon
    const input = new Input({ ...inputLayouts.firstPerson, ...isTouchScreen && {
      buttonDict: { ...inputLayouts.firstPerson.buttonDict, special: icons.sneak, attack2: icons.take } } })
    this.controllers.push(new PrisonerKeys(this.player, input),
      new MouseLook(this.player), new TouchLook(this.player))
    const playerModel = new PrisonerFootsteps(this.player, { mesh: createPlayerBox({ visible: false }), impactAt, ground: footing })
    this.audioPlayer = () => playerModel
    this.viewScene = new Scene()
    this.viewCamera = new PerspectiveCamera(88, this.camera.aspect, .10, 20)
    const viewLight = new DirectionalLight(0xdce4ef, 1.15)
    viewLight.position.set(-.4, .9, .65)
    this.viewScene.add(this.viewCamera, new HemisphereLight(0xc2cddb, 0x726054, 1.35), viewLight)
    const avatar = new PrisonerAvatar(this.player, this.viewScene, this.viewCamera)
    this.prisonerAvatar = avatar
    const weapons = new CampWeapons({ player: this.player, playerView: playerModel, avatar, queries: enemyWorld,
      canTake: () => this.session.state === 'running', touch: input.screen, guardSounds: soldiers.map(soldier => soldier.attackSound) })
    weapons.equip(germanSoldier.twoHandedWeapon, germanSoldier.attackSound)
    this.add(this.player, playerModel, new FirstPersonView(this.player, { camera: this.camera,
      weaponSrc: () => avatar.current.pose === 'rifle' ? '/assets/images/ui/savo.png' : null, behind: 0 }),
    avatar, weapons)

    const navigation = new CampNavigation(playerWorld.isBlocked, [.75, 1, ...prisonerLooks.map(look => look.height / 2)])
    const guards = []
    const onFirstSpot = guard => {
      this.sceneAudio.emit(halt, { profile: shout, spatial: { position: guard.eye } })
      raiseAlarm(guards, guards.find(controller => controller.body === guard))
    }
    const sees = (guard, prisoner) => enemyWorld.sees(guard.eye, prisoner.eye)
    const litAt = point => this.camp.litAt(point, enemyWorld.sees)
    this.prisoners = [this.player]
    this.enemies = Array.from({ length: 10 }, () => {
      const index = coords.findIndex(point => Math.hypot(point.x - this.player.x, point.z - this.player.z) > 12)
      const { x, z } = coords.splice(index, 1)[0]
      const soldier = sample(soldiers)
      const { body, model } = makeCharacter(soldier, { x, z, targets: [this.player], damage: computerDamage, ground: footing,
        ...enemyWorld })
      weapons.register(body, model, soldier)
      const guard = new CampGuard(body, { target: this.player, candidates: this.prisoners,
        way: 'wander', sees, litAt, onFirstSpot, navigation })
      guards.push(guard)
      this.controllers.push(guard)
      this.add(body, model)
      return body
    })
    this.player.targets = this.enemies

    this.firstAids = Array.from({ length: 2 }, () => {
      const firstAid = new FirstAid({ pos: coords.pop() })
      this.addMesh(firstAid.mesh)
      return firstAid
    })

    const createObject = [createCrate, createRustyBarrel, createMetalBarrel]
    for (let i = 0; i < 10; i++) {
      const pos = coords.pop()
      const mesh = sample(createObject)({ pos })
      this.addMesh(mesh)
      mesh.updateMatrixWorld(true)
      this.camp.walkSolids.push(mesh)
      this.camp.opaqueSolids.push(mesh)

    }

    const coverPoints = this.camp.opaqueSolids.flatMap(mesh => {
      const { min, max } = new Box3().setFromObject(mesh)
      return [
        { x: min.x - .8, z: (min.z + max.z) / 2 }, { x: max.x + .8, z: (min.z + max.z) / 2 },
        { x: (min.x + max.x) / 2, z: min.z - .8 }, { x: (min.x + max.x) / 2, z: max.z + .8 },
      ].filter(point => Math.abs(point.x) < 38 && Math.abs(point.z) < 38)
    })
    this.escapees = Array.from({ length: 3 }, (_, index) => {
      const look = prisonerLooks[index]
      const body = new Prisoner({ x: this.layout.start.x - .6 + index * .6,
        z: this.layout.start.z + 1, speed: 1.5 + index * .12, reach: 1.65,
        size: { height: look.height, length: .4, width: .4 }, actions: { attack: 1.74 },
        targets: this.enemies, solid: false, ...playerWorld })
      body.crouched = true
      body.name = look.name
      const model = new PrisonerModel(body, { index, textures: this.companionTextures ??= new Map(), impactAt,
        ground: footing })
      this.prisoners.push(body)
      const controller = new CampCompanion(body, { leader: this.player, enemies: this.enemies,
        navigation, coverPoints, sees: enemyWorld.sees, index, companions: this.prisoners,
        postureDurations: model.postureDurations,
        postureShift: (name, time) => model.postureShift(name, time) })
      this.controllers.push(controller)
      this.add(body, model)
      return { body, model, controller }
    })

    this.snow = new Snow()
    this.addMesh(this.snow.mesh)

    this.fire = new Fire({ pos: this.maze.exitPosition })
    this.addMesh(this.fire.mesh)
  }

  end() {
    super.end()
    this.enemies = []
  }

  render() {
    super.render()
    if (!this.viewScene || this.prisonerAvatar.current.pose === 'rifle') return

    const { viewRenderer, viewCamera } = this
    if (viewCamera.aspect !== this.camera.aspect) {
      viewCamera.aspect = this.camera.aspect
      viewCamera.updateProjectionMatrix()
    }
    const { autoClear } = viewRenderer
    viewRenderer.autoClear = false
    try {
      viewRenderer.clearDepth()
      viewRenderer.render(this.viewScene, viewCamera)
    } finally {
      viewRenderer.autoClear = autoClear
    }
  }

  disposeScene() {
    super.disposeScene()
    if (this.viewScene) super.disposeScene(this.viewScene)
  }

  update(dt, t) {
    super.update(dt, t)
    this.snow.update(dt, t)
    this.fire.update(dt, t)
    this.healPlayer()
    const killed = this.enemies.filter(enemy => enemy.dead)
    const { x, z } = this.maze.exitPosition
    const won = Math.hypot(this.player.x - x, this.player.z - z) < 5

    if (won)
      this.victory(text.victory(killed.length, this.enemies.length))

    if (this.player.dead)
      this.defeat(text.defeat)

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
