import * as THREE from 'three'
import Scene3D from '/core/Scene3D.js'
import { createGroundMaterial } from '/core3d/ground.js'
import { hemLight, dirLight } from '/core3d/light.js'
import { fpsControls } from '/ui/Controls.js'
import { currentStyleClasses } from '/ui/styles.js'
import Input from '/core/io/Input.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import CoverSoldier, { coverSoldier } from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import Transport from '/core/gameplay/bodies/aircraft/Transport.js'
import Firearm, { firearms } from '/core/gameplay/Firearm.js'
import TriggerKeys from '/core/gameplay/controllers/TriggerKeys.js'
import WalkKeys from '/core/gameplay/controllers/WalkKeys.js'
import CoverFighter from '/core/gameplay/controllers/CoverFighter.js'
import fightingPlace from './fightingPlace.js'
import buildTown, { river } from './town.js'
import placeWarTraces from './warTraces.js'
import Streets from './Streets.js'
import { rayBoxEntry } from '/core/collision/ray.js'
import Defender from '/core/gameplay/controllers/Defender.js'
import { createPlayerBox } from '/core3d/geometry/index.js'
import { requestModels } from '/core3d/assets/models.js'
import { loadPixelArt } from '/core3d/assets/pixelArt.js'
import { createRockPile, rockMaterial } from '/core3d/geometry/rocks.js'
import { createStoneWall, stoneWallMaterial } from '/core3d/geometry/stoneWall.js'
import { createTexture } from '/core3d/helpers.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import TouchLook from '/core3d/actor/characters/TouchLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'
import ParachutistSprite, { parachutistArt } from '/core3d/actor/soldiers/ParachutistSprite.js'
import CoverSoldierModel, { flash, models as coverSoldierModels } from '/core3d/actor/soldiers/CoverSoldierModel.js'
import Ju52, { models as ju52Models } from '/core3d/actor/aircraft/Ju52.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { description as sovietPartisan, models as sovietPartisanModels } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { description as resistanceFighter, models as resistanceFighterModels } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { description as partisanLowpoly, models as partisanLowpolyModels } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import Church, { models as churchModels } from '/core3d/actor/buildings/Church.js'
import Sandbags, { models as sandbagsModels } from '/core3d/actor/buildings/Sandbags.js'
import { models as townHouseModels } from '/core3d/actor/buildings/TownHouse.js'
import { models as warDebrisModels } from '/core3d/actor/buildings/WarDebris.js'

const messages = {
  intro: '<ul><li>Hold the position</li><li>Shoot the paratroopers before they reach cover</li></ul>',
  report: 'Drvar, 25 May 1944\n\nGerman paratroopers descend on Drvar to capture the Partisan Supreme Headquarters. Hold your position while the headquarters staff escapes.',
  machineGun: 'Take his machine gun',
  victory: 'The staff got away. You held the position.',
  defeat: 'The position has fallen.',
}

/** The town around the stronghold is level ground. */
const groundAt = () => 0

/**
 * The stronghold "Moskva": the churchyard, `length` metres along x and `width` along z, walled round with old stone,
 * `wall` high and thick, with a `gate` metres wide in its west side, barred with sandbags. The partisans hold it close behind the wall,
 * `inside` metres from its middle, each looking out over it the way of his `yaw`: the player at the east wall, the
 * machine gunner beside him, the others along the other sides.
 */
const yard = { length: 24, width: 20, wall: { height: 1.1, thickness: .6, spacing: 2 }, gate: 3, inside: .55 }
const posts = { player: { x: 1, z: 0, yaw: 0, pitch: .2 }, comrades: [{ x: 1, z: -.4, yaw: 0 }, { x: 0, z: -1, yaw: Math.PI / 2 },
  { x: 0, z: 1, yaw: -Math.PI / 2 }, { x: -1, z: .4, yaw: Math.PI }] }

/**
 * Each wave is a stream of `passes` of Ju 52 in a vee over the town, one every `interval` seconds, each plane with
 * `jumpers`; the leader flies `height` metres up, `ahead` metres in front of the player, give or take, the
 * others `across` to its sides and `back` behind it. Each drops over `zone` metres across the stronghold, so the
 * paratroopers fill the sky and come down all round. The second wave comes `pause` seconds after the first is beaten.
 */
const waves = [
  { passes: 3, jumpers: 3, interval: 9 },
  { passes: 4, jumpers: 3, interval: 8 },
]
const vee = [{ across: 0, back: 0 }, { across: -28, back: 22 }, { across: 28, back: 22 }]
const flight = { height: 95, ahead: [25, 110], start: 380, zone: 180, wind: 1.5 }
const pause = 8

/**
 * The rubble heaps of the bombed town the paratroopers run to: `count` of them, `width` and `height` metres between
 * the least and the most, from `near` to `far` metres around the stronghold. One farther than `reach` from where a
 * paratrooper lands is no cover for him; behind one he stands `behind` metres beyond it.
 */
const covers = { count: 36, width: [2, 4], height: [1, 1.6], near: 20, far: 120, reach: 40, behind: 1 }
/** The metres a German on foot fires from: farther off he is a speck on the screen, so he comes closer first. */
const fireRange = 50
/** The height a man up from cover sees and is seen from, in metres. */
const eyeHeight = 1.5

/** A house or the church as a box a shot can strike, from the ground it covers and its `height`. */
const blockOf = ({ min, max, height }) => ({ x: (min.x + max.x) / 2, y: height / 2, z: (min.z + max.z) / 2,
  size: { length: max.x - min.x, height, width: max.z - min.z } })

/**
 * The comrades, each his own man, as the defenders of Jablanica: the machine gunner with his captured MG 42, then
 * partisans in a wool shirt, a brown uniform and a grey cap with a moustache, each `figure` dressed in a `look`.
 */
const comrades = [
  { figure: sovietPartisan },
  { figure: resistanceFighter, look: variants.vuna },
  { figure: partisanLowpoly, look: variants.smedji },
  { figure: resistanceFighter, look: variants.brkovi },
]

/**
 * Where a post `{ x, z }` given in shares of the yard's half sides stands: `x` 1 is a pace inside the east wall, `z` 1
 * inside the south one, and between them along the wall.
 */
const postAt = ({ x, z }) => ({
  x: x * (yard.length / 2 - yard.inside),
  z: z * (yard.width / 2 - yard.inside),
})

export default class DrvarScene extends Scene3D {
  constructor() {
    super({ usePointerLock: true, controlKeys: fpsControls, intro: messages.intro, reportText: messages.report })
  }

  async init() {
    const pictures = [...parachutistArt.pictures, flash.picture]
    const [textures] = await Promise.all([
      Promise.all(pictures.map(loadPixelArt)).then(loaded => new Map(pictures.map((src, i) => [src, loaded[i]]))),
      requestModels([...sovietPartisanModels, ...resistanceFighterModels, ...partisanLowpolyModels, ...churchModels, ...sandbagsModels, ...ju52Models,
        ...coverSoldierModels, ...townHouseModels, ...warDebrisModels]),
    ])
    // a newer start ended this scene while its pictures loaded: they are its alone, so it frees them
    if (!this.session.active) return textures.forEach(texture => texture.dispose())
    this.textures = textures
    this.backgroundColor = 0xb9ad94
    this.scene.fog = new THREE.Fog(0xb9ad94, 120, 520)
    hemLight({ intensity: 1.4, skyColor: 0xf1e6c8, groundColor: 0x6b6450, scene: this.scene })
    // the morning sun shows the facets of the rubble
    dirLight({ scene: this.scene, pos: [-60, 80, 30], intensity: 1.2 })
    this.rock = rockMaterial(createTexture({ file: 'terrain/rocks.jpg' }))
    this.addMesh(createTownGround(), createPanorama())
    const town = buildTown()
    this.addMesh(...town.houses.map(house => house.mesh), ...town.ground)
    const { length, width, wall } = yard
    const yardBlock = { min: { x: -(length + wall.thickness) / 2, z: -(width + wall.thickness) / 2 },
      max: { x: (length + wall.thickness) / 2, z: (width + wall.thickness) / 2 } }
    const traces = placeWarTraces([yardBlock, river, ...town.footprints])
    this.addMesh(...traces.meshes)
    /** The ground the houses and the wrecks stand on: no rubble lies there, and no one stays inside. */
    this.footprints = [...town.footprints, ...traces.footprints]
    const previousFilter = document.body.style.filter
    document.body.style.filter = 'sepia(0.4)'
    this.session.scope.add(() => {
      document.body.style.filter = previousFilter
    })

    this.enemies = []
    /** The enemies a shot can hit now: the living, and of those behind cover only the ones up to fire. */
    this.targets = []
    this.coverSpots = [...this.placeCovers(), ...this.wallCovers()]
    this.buildYardWall()
    const church = new Church()
    church.mesh.rotation.y = Math.PI / 2
    this.addMesh(church.mesh)
    const churchBox = new THREE.Box3().setFromObject(church.mesh, true)
    /** The houses and the church, which stop a shot; the yard's low wall does not. */
    this.shotBlocks = [...this.footprints, { min: churchBox.min, max: churchBox.max, height: churchBox.max.y }].map(blockOf)
    /** The ways of the Germans on foot round the houses and the churchyard. */
    this.streets = new Streets([...this.footprints, yardBlock])
    this.placePlayer(churchBox)
    this.outfits = new Map()
    this.comrades = posts.comrades.map((post, i) => this.placeComrade(post, comrades[i]))
    this.partisans = [this.player, ...this.comrades]
    this.planes = []
    this.wave = 0
  }

  /**
   * The player at his post by the east wall. He walks about the yard to hold another wall, kept inside it by its walls,
   * out of the `church` `Box3` and off his living comrades; the stronghold is surrounded, so he never leaves it.
   */
  placePlayer(church) {
    const size = { length: .4, height: 1.78, width: .4 }
    const inside = { x: yard.length / 2 - yard.wall.thickness / 2 - size.length / 2, z: yard.width / 2 - yard.wall.thickness / 2 - size.width / 2 }
    const isBlocked = (from, direction, distance) => {
      const x = from.x + direction.x * distance, z = from.z + direction.z * distance, margin = size.length / 2
      const inChurch = x > church.min.x - margin && x < church.max.x + margin && z > church.min.z - margin && z < church.max.z + margin
      return inChurch || this.comrades.some(comrade => comrade.alive && Math.hypot(comrade.x - x, comrade.z - z) < size.length)
    }
    this.player = new Character({ ...postAt(posts.player), yaw: posts.player.yaw, pitch: posts.player.pitch, y: .89, size,
      strikeHeight: .82, actions: { attack: .1 }, pitchRange: { min: -Math.PI / 6, max: Math.PI / 2.5 }, targets: this.targets,
      groundAt, isBlocked, obstacleAt: this.obstacleAt, bounds: { min: { x: -inside.x, z: -inside.z }, max: inside } })
    const input = new Input(inputLayouts.firstPerson)
    this.trigger = new TriggerKeys(this.player, input, new Firearm(firearms.rifle))
    this.controllers.push(new WalkKeys(this.player, input), new MouseLook(this.player), new TouchLook(this.player), this.trigger)
    const playerModel = new CharacterModel(this.player, { mesh: createPlayerBox({ visible: false }), attackSound: 'rifle.mp3' })
    this.audioPlayer = () => playerModel
    this.add(this.player, playerModel, new FirstPersonView(this.player, { camera: this.camera, weaponSrc: null,
      readiness: () => this.trigger.firearm.readiness }))
  }

  /**
   * A comrade at his post, dressed in his own `look` of the partisans' clothes, with the same reach and damage as the
   * player's rifle, so he hits the paratroopers as far off as the player does.
   */
  placeComrade(post, { figure, look }) {
    const { reach, damage } = firearms.rifle
    const { body, model } = makeCharacter(figure, { ...postAt(post), y: .9, yaw: post.yaw, walks: false, targets: this.targets,
      reach, damage, pitchRange: { min: -Math.PI / 6, max: Math.PI / 2.5 }, groundAt, obstacleAt: this.obstacleAt })
    if (look) dressFighter(model.mesh, look.outfit, this.outfits, look.hatColor)
    this.controllers.push(new Defender(body, { enemies: this.enemies }))
    this.add(body, model)
    return body
  }

  /** The churchyard's wall of old stone all round, broken only by the gate in its west side, which sandbags bar. */
  buildYardWall() {
    const material = stoneWallMaterial()
    const { length, width, gate } = yard
    const { height, thickness } = yard.wall
    const side = (span, x, z, alongZ) => {
      const wall = createStoneWall({ length: span, height, thickness, material })
      wall.position.set(x, 0, z)
      if (alongZ) wall.rotation.y = Math.PI / 2
      this.addMesh(wall)
    }
    side(length, 0, -width / 2, false)
    side(length, 0, width / 2, false)
    side(width, length / 2, 0, true)
    const leaf = (width - gate) / 2
    side(leaf, -length / 2, -(gate + leaf) / 2, true)
    side(leaf, -length / 2, (gate + leaf) / 2, true)
    // an improvised bunker: a wall of sandbags across the gate
    const sandbags = new Sandbags()
    sandbags.mesh.position.set(-length / 2, 0, 0)
    sandbags.mesh.rotation.y = Math.PI / 2
    this.addMesh(sandbags.mesh)
  }

  /**
   * The outer face of the churchyard wall as cover, a spot every `wall.spacing` metres along it and none at the
   * gate, each facing out of the yard.
   */
  wallCovers() {
    const { length, width, gate, wall } = yard
    const spots = []
    const along = (span, place) => {
      for (let at = -span / 2 + wall.spacing / 2; at < span / 2; at += wall.spacing) spots.push(place(at))
    }
    along(length, x => ({ x, z: -width / 2, out: { x: 0, z: -1 } }))
    along(length, x => ({ x, z: width / 2, out: { x: 0, z: 1 } }))
    along(width, z => ({ x: length / 2, z, out: { x: 1, z: 0 } }))
    along(width, z => ({ x: -length / 2, z, out: { x: -1, z: 0 } }))
    return spots.filter(spot => spot.x > -length / 2 || Math.abs(spot.z) > gate / 2)
      .map(spot => ({ ...spot, height: wall.height, taken: false }))
  }

  /** Spreads the rubble heaps all round the stronghold; each covers as high as it is. */
  placeCovers() {
    const { randFloat } = THREE.MathUtils
    return Array.from({ length: covers.count }, () => {
      let x, z
      do {
        const distance = randFloat(covers.near, covers.far), angle = randFloat(0, Math.PI * 2)
        x = Math.cos(angle) * distance
        z = Math.sin(angle) * distance
      } while (this.houseAt(x, z, covers.width[1]))
      const height = randFloat(...covers.height)
      const heap = createRockPile({ width: randFloat(...covers.width), height, material: this.rock })
      heap.position.set(x, groundAt(x), z)
      this.addMesh(heap)
      return { x, z, height, taken: false }
    })
  }

  /** How far a shot from `from` the way of `direction` goes before a house or the church stops it. */
  obstacleAt = (from, direction, reach) =>
    Math.min(reach, ...this.shotBlocks.map(block => rayBoxEntry(from, direction, block) ?? Infinity))

  /** Whether one at `from` sees `to`, both `{ x, y, z }`, past the houses and the church. */
  sees = (from, to) => {
    const way = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }
    const distance = Math.hypot(way.x, way.y, way.z)
    if (distance === 0) return true
    const direction = { x: way.x / distance, y: way.y / distance, z: way.z / distance }
    return this.obstacleAt(from, direction, distance) >= distance
  }

  /** The ground a house covers at `x, z`, `margin` metres round it included, if any does. */
  houseAt(x, z, margin = 0) {
    return this.footprints.find(({ min, max }) =>
      x > min.x - margin && x < max.x + margin && z > min.z - margin && z < max.z + margin)
  }

  /** The point `x, z`, or, in a house, the one just outside its nearest wall, where one who came down on its roof stands. */
  besideHouse(x, z) {
    const house = this.houseAt(x, z)
    if (!house) return { x, z }
    const { min, max } = house, out = 1
    const ways = [[x - min.x, { x: min.x - out, z }], [max.x - x, { x: max.x + out, z }],
      [z - min.z, { x, z: min.z - out }], [max.z - z, { x, z: max.z + out }]]
    return ways.sort((a, b) => a[0] - b[0])[0][1]
  }

  start() {
    super.start()
    this.sendWave()
  }

  /** The next wave's vees, one after another, flying over the town from either side. */
  sendWave() {
    const wave = waves[this.wave]
    for (let i = 0; i < wave.passes; i++)
      this.session.gameplay.after(i * wave.interval, () => this.sendVee(wave.jumpers, i % 2 ? 1 : -1))
    this.waveEnd = (wave.passes - 1) * wave.interval
    this.waveTime = 0
  }

  /** A vee of planes flying from the `side` of +z or -z over the stronghold, each dropping over the same zone. */
  sendVee(jumpers, side) {
    const lead = THREE.MathUtils.randFloat(...flight.ahead)
    for (const { across, back } of vee) {
      const start = flight.start + back
      const body = new Transport({ x: lead + across, y: flight.height, z: side * start, yaw: side * Math.PI / 2, jumpers,
        drop: { from: start - flight.zone / 2, to: start + flight.zone / 2 } })
      body.sent = 0
      this.planes.push(body)
      this.add(body, new Ju52(body))
    }
  }

  /** Each paratrooper a plane lets go of sinks from where it is, the wind drifting him the same way for all. */
  dropJumpers() {
    for (const plane of this.planes)
      while (plane.sent < plane.jumped) {
        plane.sent++
        const body = new Parachutist({ x: plane.x, y: plane.y - 3, z: plane.z, groundAt,
          drift: { x: -flight.wind, z: THREE.MathUtils.randFloatSpread(flight.wind) } })
        const picture = parachutistArt.pictures[Math.floor(Math.random() * parachutistArt.pictures.length)]
        this.enemies.push(body)
        this.add(body, new ParachutistSprite(body, { texture: this.textures.get(picture) }))
      }
  }

  /** A paratrooper on the ground goes on as a soldier on foot: the living one to his `fightingPlace`. */
  landJumpers() {
    for (const body of this.enemies) {
      if (!(body instanceof Parachutist) || body.handedOver || body.feet > groundAt(body.x)) continue
      body.handedOver = true
      const { x, z } = this.besideHouse(body.x, body.z)
      const soldier = new CoverSoldier({ x, z, y: groundAt(x) + coverSoldier.size.height / 2 })
      this.enemies.push(soldier)
      this.add(soldier, new CoverSoldierModel(soldier, { flashPicture: this.textures.get(flash.picture), front: this.player, viewer: this.player }))
      if (body.dead) {
        soldier.setState('dead')
        continue
      }
      this.controllers.push(new CoverFighter(soldier, { targets: this.partisans, range: fireRange, sees: this.sees }))
      const inSight = spot => this.sees({ x: spot.x, y: eyeHeight, z: spot.z }, this.player)
      const place = fightingPlace(soldier, { spots: this.coverSpots, target: this.player, range: fireRange, reach: covers.reach,
        behind: covers.behind, inSight })
      if (!place) continue
      const goal = place.cover ? place : this.besideHouse(place.x, place.z)
      soldier.moveTo(goal, this.streets.route(soldier, goal) ?? [])
    }
  }

  /** The machine gunner beside the player falls before the second wave, if he has not already; his gun is the player's. */
  takeMachineGun() {
    const [gunner] = this.comrades
    if (gunner.alive) gunner.setState('dead')
    if (this.trigger.firearm.automatic) return
    this.trigger.equip(new Firearm(firearms.machineGun))
    this.ui.showMessage(messages.machineGun)
  }

  get waveBeaten() {
    return this.waveTime > this.waveEnd && this.planes.every(plane => plane.dead || plane.jumped === plane.jumpers)
      && this.enemies.every(enemy => enemy.dead || (enemy instanceof Parachutist && enemy.handedOver))
  }

  update(dt, t) {
    super.update(dt, t)
    this.dropJumpers()
    this.landJumpers()
    this.targets.length = 0
    this.targets.push(...this.enemies.filter(enemy => enemy.alive && enemy.exposed !== false))
    if (this.comrades[0].dead && this.wave === 0) this.takeMachineGun()
    if (this.player.dead) return this.defeat(messages.defeat)
    if (this.session.state !== 'running') return
    this.waveTime += dt
    if (this.betweenWaves || !this.waveBeaten) return
    if (this.wave === waves.length - 1) return this.victory(messages.victory)
    this.betweenWaves = true
    this.takeMachineGun()
    this.session.gameplay.after(pause, () => {
      this.betweenWaves = false
      this.wave++
      this.sendWave()
    })
  }

  sceneUI() {
    const left = this.enemies.filter(enemy => enemy.alive && !(enemy instanceof Parachutist && enemy.handedOver)).length
    const { firearm } = this.trigger
    const ammo = firearm.reloading ? 'Reloading' : `Ammo ${firearm.rounds}/${firearm.magazine}`
    return /* html */`
      <div class="top-left ${currentStyleClasses().score}">
        <div>
          Wave: ${this.wave + 1}
          <br><small>Paratroopers: ${left}</small>
          <br><small>${ammo}</small>
        </div>
      </div>
    `
  }
}

/** The level ground of the town, its earth trampled and burnt. */
function createTownGround(size = 1200) {
  const material = createGroundMaterial({ file: 'terrain/ground.jpg', repeat: size / 8 })
  material.color.set(0xb8b49a)
  const geometry = new THREE.PlaneGeometry(size, size)
  geometry.rotateX(-Math.PI / 2)
  return new THREE.Mesh(geometry, material)
}

/** Keep the mountain silhouette near the horizon and show the scene's sky above it. */
function createPanorama(radius = 600) {
  const texture = new THREE.TextureLoader().load('/assets/images/background/planine.png')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.x = -1
  const geometry = new THREE.CylinderGeometry(radius, radius, 144, 64, 1, true)
  geometry.translate(0, -6, 0)
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, alphaTest: .5, fog: false })
  return new THREE.Mesh(geometry, material)
}
