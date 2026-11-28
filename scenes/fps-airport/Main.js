import Scene3D from '/core/Scene3D.js'
import { Fog, MathUtils } from 'three'
import { createHillyTerrain, createFloor } from '/core3d/ground.js'
import { createMoon } from '/core3d/light.js'
import { createTexture, sample, getEmptyCoords } from '/core3d/helpers.js'
import { fpsControls } from '/ui/Controls.js'
import { createAirport } from '/core3d/city.js'
import { loadModel } from '/core3d/loaders.js'
import { description as tank, models as tankModels } from '/core3d/actor/derived/Tank.js'
import { description as germanMachineGunner, models as germanMachineGunnerModels } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { description as ssSoldier, models as ssSoldierModels } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { description as naziOfficer, models as naziOfficerModels } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { description as germanSoldier, models as germanSoldierModels } from '/core3d/actor/derived/ww2/GermanSoldier.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import { createPlayerBox } from '/core3d/geometry/index.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import Building from '/core/gameplay/bodies/buildings/Building.js'
import Tower, { airfieldTower } from '/core/gameplay/bodies/buildings/Tower.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { computerDamage } from '/core/gameplay/damage.js'
import Input from '/core/io/Input.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import CharacterModel, { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import TouchLook from '/core3d/actor/characters/TouchLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel, parkedBombers } from '/core3d/actor/buildings/buildingModels.js'
import airfieldMarkings from './airfieldMarkings.js'
import { texts } from '/scenes/texts.js'

const text = texts['fps-airport']

const mapSize = 200
const dornierNum = 8, stukaNum = 8, heinkelNum = 7

async function airfieldValley() {
  const ground = await createHillyTerrain({ size: 1300, segments: 96,
    factorX: 1.7, factorZ: 2.3, factorY: 43, aboveSea: 1,
    terrainColors: [0xa7ab86, 0x999f7c, 0x7b8d77, 0x79877a] })
  const { position } = ground.geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const distance = Math.hypot(position.getX(i), position.getZ(i))
    position.setY(i, position.getY(i) * MathUtils.smoothstep(distance, 165, 380) - .1)
  }
  ground.geometry.computeVertexNormals()
  ground.material.map = createTexture({ file: 'terrain/suva-trava.jpg', repeat: 140 })
  return ground
}

export default class FpsAirportScene extends Scene3D {
  constructor() {
    super({
      usePointerLock: true,
      showControls: true,
      canvasBackground: 'linear-gradient(#779db6, #ced9d6 58%, #d3d7c9)',
      controlKeys: fpsControls,
      intro: text.intro,
      reportText: text.report,
    })
  }

  async init() {
    const bomberModels = Object.values(parkedBombers).map(({ model }) => model)
    await requestModels([...bomberModels, towerModel, ...tankModels, ...germanMachineGunnerModels, ...ssSoldierModels, ...naziOfficerModels, ...germanSoldierModels])
    this.scene.fog = new Fog(0xc5d1d0, 145, 540)
    const ground = await airfieldValley()
    const floor = createFloor({ size: mapSize, file: 'terrain/asphalt.jpg' })
    this.solids = []

    const coords = getEmptyCoords({ mapSize: mapSize * .5 })
    // the player's targets: the parked planes, the towers and the soldiers
    this.enemies = []
    const playerSolids = []
    this.player = new Character({ x: 100, size: { length: .4, height: 1.78, width: .4 }, reach: 100, jumping: 'fly',
      strikeHeight: .82, targets: this.enemies, ...worldQueries(playerSolids) })
    this.player.face({ x: 78, z: 48 })
    this.controllers.push(new CharacterKeys(this.player, new Input(inputLayouts.firstPerson)),
      new MouseLook(this.player), new TouchLook(this.player))
    const playerModel = new CharacterModel(this.player, { mesh: createPlayerBox({ visible: false }), attackSound: 'rifle.mp3' })
    this.audioPlayer = () => playerModel
    this.add(this.player, playerModel, new FirstPersonView(this.player, { camera: this.camera }))

    const park = (kind, x, z) => {
      const { model, origin } = parkedBombers[kind]
      const mesh = loadedModel(model), size = modelSize(mesh)
      const body = new Building({ kind: 'aircraft', size, x, z, y: size.height / 2 })
      this.add(body, new BuildingModel(body, { mesh, origin, smokyChance: .5 }))
      this.enemies.push(body)
      return body
    }
    this.aircraft = [
      ...Array.from({ length: dornierNum }, (_, i) => park('dornier', -50 + i * 15, -75)),
      ...Array.from({ length: stukaNum }, (_, i) => park('stuka', -55, -55 + i * 12)),
      ...Array.from({ length: heinkelNum }, (_, i) => park('heinkel', -50 + i * 18, 50)),
    ]

    ;[[-75, -75], [-75, 75], [75, -75], [75, 75]].forEach(([x, z]) => {
      const mesh = loadedModel(towerModel), size = modelSize(mesh)
      const body = new Tower({ clock: this.session.clock, targets: [this.player], gun: airfieldTower, size, x, z, y: size.height / 2 })
      this.add(body, new BuildingModel(body, { mesh }))
      this.enemies.push(body)
    })

    const airport = createAirport()
    airport.translateX(75)
    airport.rotateY(Math.PI * .5)

    const airport2 = airport.clone()
    airport2.translateX(25)

    const bunker = await loadModel({ file: 'building/bunker.fbx', size: 3, texture: 'terrain/concrete.jpg' })
    bunker.position.set(75, 0, 25)

    this.solids.push(airport, airport2, bunker)
    playerSolids.push(...this.solids)
    const world = worldQueries(this.solids)
    const half = mapSize / 2
    const bounds = { min: { x: -half, z: -half }, max: { x: half, z: half } }

    for (let i = 0; i < 10; i++) {
      const { x, z } = coords.pop()
      const { body, model } = makeCharacter(sample([germanMachineGunner, ssSoldier, naziOfficer, germanSoldier]),
        { x, z, bounds, targets: [this.player], damage: computerDamage, ...world })
      this.controllers.push(new CharacterAI(body, { target: this.player, way: 'wander', sees: world.sees }))
      this.add(body, model)
      this.enemies.push(body)
    }

    // a tank patrols the airfield, turning back every 30 m
    const patrol = makeCharacter(tank, { bounds, ...world })
    this.controllers.push(new CharacterAI(patrol.body, { way: 'patrol', patrolDistance: 30 }))
    this.add(patrol.body, patrol.model)

    this.addMesh(ground, floor, airfieldMarkings(mapSize, this.aircraft), createMoon(), airport, airport2, bunker)
  }

  sceneUI() {
    const destroyed = this.aircraft.filter(plane => plane.dead)
    const left = this.aircraft.length - destroyed.length
    return this.ui.scoreUI('Score', destroyed.length, 'Enemy left', left)
  }

  update(dt) {
    super.update(dt)
    if (!document.pointerLockElement) return

    const destroyed = this.aircraft.filter(plane => plane.dead)

    if (this.player.dead)
      this.defeat(text.defeat)

    if (destroyed.length === this.aircraft.length)
      this.victory(text.victory)
  }
}
