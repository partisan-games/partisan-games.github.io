import * as THREE from 'three'
import config from '/config.js'
import Scene3D from '/core/Scene3D.js'
import { hemLight, dirLight } from '/core3d/light.js'
import { fpsControls } from '/ui/Controls.js'
import { currentStyleClasses } from '/ui/styles.js'
import Input from '/core/io/Input.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import { icons } from '/core/io/icons.js'
import optionalEffect from '/core/io/optionalEffect.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import CoverSoldier, { coverSoldier } from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import Transport from '/core/gameplay/bodies/aircraft/Transport.js'
import Firearm, { firearms } from '/core/gameplay/Firearm.js'
import TriggerKeys from '/core/gameplay/controllers/TriggerKeys.js'
import fightingPlace from './fightingPlace.js'
import buildTown, { roads } from './town.js'
import { createCave, createTerrain, createUnac, craterPlots, craters, groundAt, riverBanks } from './terrain.js'
import { formationFor, reliefAt, secondWaveAt, waves, wind } from './assault.js'
import placeWarTraces from './warTraces.js'
import { placeRuins, placeTrees, ridgeTrees, treeModels } from './scenery.js'
import Streets from './Streets.js'
import ReliefColumn, { columnDepth } from './ReliefColumn.js'
import WeaponView, { weaponKind, weaponNames } from './WeaponView.js'
import { crouchHeight, crouchKey, YardAttacker, YardDefender, YardWalk } from './yardCover.js'
import { rayBoxEntry } from '/core/collision/ray.js'
import { createPlayerBox } from '/core3d/geometry/index.js'
import { loadedModel, requestModels } from '/core3d/assets/models.js'
import { loadPixelArt } from '/core3d/assets/pixelArt.js'
import { Smoke } from '/core3d/Particles.js'
import { createRockPile, rockMaterial } from '/core3d/geometry/rocks.js'
import { createStoneWall, stoneWallMaterial } from '/core3d/geometry/stoneWall.js'
import { createTexture } from '/core3d/helpers.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter, { makeCharacterBody } from '/core3d/actor/characters/makeCharacter.js'
import MouseLook from '/core3d/actor/characters/MouseLook.js'
import TouchLook from '/core3d/actor/characters/TouchLook.js'
import FirstPersonView from '/core3d/actor/characters/FirstPersonView.js'
import ParachutistSprite, { parachutistArt } from '/core3d/actor/soldiers/ParachutistSprite.js'
import CoverSoldierModel, { flash, models as coverSoldierModels } from '/core3d/actor/soldiers/CoverSoldierModel.js'
import Ju52, { models as ju52Models } from '/core3d/actor/aircraft/Ju52.js'
import Dfs230, { dfs230Model } from '/core3d/actor/aircraft/Dfs230.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { description as sovietPartisan, models as sovietPartisanModels } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { description as resistanceFighter, models as resistanceFighterModels } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { description as partisanLowpoly, models as partisanLowpolyModels } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import Church, { models as churchModels } from '/core3d/actor/buildings/Church.js'
import Sandbags, { models as sandbagsModels } from '/core3d/actor/buildings/Sandbags.js'
import { models as townHouseModels } from '/core3d/actor/buildings/TownHouse.js'
import { warDebris } from '/core3d/actor/buildings/WarDebris.js'
import { models as drvarPropModels } from '/core3d/actor/buildings/DrvarProp.js'

const messages = {
  intro: '<ul><li>Hold the churchyard until the Lika brigade arrives</li><li>Shoot the paratroopers before they reach cover</li></ul>',
  report: 'Drvar, 25 May 1944\n\nGerman paratroopers descend on Drvar to capture the Partisan Supreme Headquarters. Hold the churchyard until reinforcements from the 3rd Brigade of the 6th Lika Division reach you.',
  machineGun: 'Take his machine gun',
  firstWave: 'First drop incoming over the town.',
  secondWave: 'Second drop near Šobića glavica. Watch the west!',
  relief: 'The Lika brigade is approaching from the west!',
  victoryTitle: 'Stigli su Ličani!',
  victory: 'The 3rd Brigade of the 6th Lika Division has reached you. You held the churchyard.',
  defeat: 'The position has fallen.',
}

/**
 * The stronghold "Moskva": the churchyard, `length` metres along x and `width` along z, walled round with old stone,
 * `wall` high and thick, with a `gate` metres wide in its west side, barred with sandbags. The partisans hold it close behind the wall,
 * `inside` metres from its middle, each looking out over it the way of his `yaw`: the player at the east wall, the
 * machine gunner beside him, the others along the other sides.
 */
const yard = { length: 24, width: 20, wall: { height: 1.1, thickness: .6, spacing: 2 }, gate: 3, inside: .55 }
const posts = { player: { x: 1, z: 0, yaw: 0, pitch: .2 }, comrades: [{ x: 1, z: -.4, yaw: 0 }, { x: 0, z: -1, yaw: Math.PI / 2 },
  { x: 0, z: 1, yaw: -Math.PI / 2 }, { x: -1, z: .4, yaw: Math.PI }] }

const reliefStart = -31
const westApproach = { min: { x: reliefStart - columnDepth - 1, z: -3 }, max: { x: -13, z: 3 } }
const reliefLine = -18

/**
 * The rubble heaps of the bombed town the paratroopers run to: `count` of them, `width` and `height` metres between
 * the least and the most, from `near` to `far` metres around the stronghold. One farther than `reach` from where a
 * paratrooper lands is no cover for him; behind one he stands `behind` metres beyond it.
 */
const covers = { count: 26, width: [2, 4], height: [1, 1.6], near: 20, far: 75, reach: 40, behind: 1 }
/** The metres a German on foot fires from: farther off he is a speck on the screen, so he comes closer first. */
const fireRange = 50
/** The height a man up from cover sees and is seen from, in metres. */
const eyeHeight = 1.5
const strikeHeight = .82
const crouchAnimation = 'Crouching Idle'
const comradeInset = yard.inside + .75
const warDebrisModels = ['burnt-truck', 'barrel', 'ammunition-box'].map(kind => warDebris[kind].model)

/** A house or the church as a box a shot can strike, from the ground it covers and its `height`. */
const blockOf = ({ min, max, height, base = 0 }) => ({ x: (min.x + max.x) / 2, y: base + height / 2, z: (min.z + max.z) / 2,
  size: { length: max.x - min.x, height, width: max.z - min.z } })

class DrvarSoldier extends CoverSoldier {
  update(dt) {
    super.update(dt)
    this.y = groundAt(this.x, this.z) + this.size.height / 2
  }
}

class YardComradeModel extends CharacterModel {
  constructor(body, options, standingHeight) {
    super(body, options)
    this.standingHeight = standingHeight
    const bounds = new THREE.Box3()
    this.mesh.traverse(part => {
      if (part.isSkinnedMesh) bounds.expandByObject(part, true)
    })
    // The imported crouch clip has a vertical root offset on our rigs.
    this.crouchLift = bounds.isEmpty() ? 0 : body.feet - bounds.min.y
    this.place()
  }

  place() {
    super.place()
    if (!this.crouchLift || this.body.dead) return
    const crouched = (this.standingHeight - this.body.size.height) / (this.standingHeight - crouchHeight)
    this.mesh.position.y += this.crouchLift * THREE.MathUtils.clamp(crouched, 0, 1)
  }

  chooseClip() {
    if (this.body.alive && this.body.crouched && !this.body.swing) return 'crouch'
    return super.chooseClip()
  }
}

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
const postAt = ({ x, z }, inset = yard.inside) => ({
  x: x * (yard.length / 2 - inset),
  z: z * (yard.width / 2 - inset),
})

export default class DrvarScene extends Scene3D {
  constructor() {
    super({ usePointerLock: true, controlKeys: { ...fpsControls, [crouchKey.label]: 'hold to crouch' },
      intro: messages.intro, reportText: messages.report })
  }

  async init() {
    const pictures = [...parachutistArt.pictures, flash.picture]
    const [textures] = await Promise.all([
      Promise.all(pictures.map(loadPixelArt)).then(loaded => new Map(pictures.map((src, i) => [src, loaded[i]]))),
      requestModels([...sovietPartisanModels, ...resistanceFighterModels, ...partisanLowpolyModels, ...churchModels, ...sandbagsModels, ...ju52Models, dfs230Model,
        ...coverSoldierModels, ...townHouseModels, ...warDebrisModels, ...drvarPropModels, ...treeModels]),
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
    this.addMesh(createTerrain(), ...createUnac(), createCave(), createPanorama())
    const distantTrees = ridgeTrees()
    this.addMesh(...distantTrees)
    this.session.scope.add(() => distantTrees.forEach(mesh => mesh.dispose()))
    const ruins = placeRuins()
    const ruinFootprints = ruins.map(({ footprint }) => footprint)
    const town = buildTown(undefined, ruinFootprints)
    this.addMesh(...town.houses.map(house => house.mesh), ...town.ground)
    this.addMesh(...ruins.map(({ mesh }) => mesh))
    const { length, width, wall } = yard
    const yardBlock = { min: { x: -(length + wall.thickness) / 2, z: -(width + wall.thickness) / 2 },
      max: { x: (length + wall.thickness) / 2, z: (width + wall.thickness) / 2 } }
    const previousFilter = document.body.style.filter
    document.body.style.filter = 'sepia(0.4)'
    this.session.scope.add(() => {
      document.body.style.filter = previousFilter
    })

    this.enemies = []
    /** The enemies a shot can hit now: the living, and of those behind cover only the ones up to fire. */
    this.targets = []
    const walls = this.buildYardWall()
    const church = new Church()
    church.mesh.rotation.y = Math.PI / 2
    this.addMesh(church.mesh)
    const churchBox = new THREE.Box3().setFromObject(church.mesh, true)
    const occupied = [...town.footprints, ...ruinFootprints]
    const trees = placeTrees([yardBlock, riverBanks, ...roads, ...occupied], churchBox)
    const yardTrunks = trees.filter(tree => tree.inside).map(({ footprint }) => footprint)
    const outdoorTrunks = trees.filter(tree => !tree.inside).map(({ footprint }) => footprint)
    const traces = placeWarTraces([yardBlock, riverBanks, westApproach, ...craterPlots, ...occupied, ...outdoorTrunks], undefined, groundAt)
    this.addMesh(...trees.map(({ mesh }) => mesh), ...traces.meshes)
    this.addBombSmoke(traces.footprints)
    this.footprints = [...occupied, ...traces.footprints, ...outdoorTrunks]
    const churchFootprint = { min: churchBox.min, max: churchBox.max, height: churchBox.max.y }
    // Use wall surfaces for the yard and ruined houses so shots follow visible gaps and changes in height.
    this.shotBlocks = [...town.footprints, ...traces.footprints, ...outdoorTrunks, ...yardTrunks, churchFootprint].map(blockOf)
    this.surfaceBlocks = [...ruins.map(({ mesh, footprint }) => ({ mesh, box: blockOf(footprint) })),
      ...walls.map(mesh => {
        const { min, max } = new THREE.Box3().setFromObject(mesh, true)
        return { mesh, box: blockOf({ min, max, base: min.y, height: max.y - min.y }) }
      })]
    this.ruinRay = new THREE.Raycaster()
    this.coverSpots = [...this.placeCovers(), ...this.wallCovers()]
    /** The ways of the Germans on foot round the houses and the churchyard. */
    this.streets = new Streets([...this.footprints, yardBlock])
    this.placePlayer(churchBox, yardTrunks)
    this.outfits = new Map()
    this.comrades = posts.comrades.map((post, i) => this.placeComrade(post, comrades[i]))
    this.reliefColumn = new ReliefColumn(partisanLowpoly, variants.smedji.outfit, this.outfits)
    this.addMesh(this.reliefColumn.mesh)
    this.session.scope.add(() => this.reliefColumn.end())
    this.partisans = [this.player, ...this.comrades]
    this.planes = []
    this.wave = 0
  }

  /**
   * The player at his post by the east wall. He walks about the yard to hold another wall, kept inside it by its walls,
   * out of the `church` `Box3` and off his living comrades; the stronghold is surrounded, so he never leaves it.
   */
  placePlayer(church, trunks) {
    const size = { length: .4, height: 1.78, width: .4 }
    const inside = { x: yard.length / 2 - yard.wall.thickness / 2 - size.length / 2, z: yard.width / 2 - yard.wall.thickness / 2 - size.width / 2 }
    const isBlocked = (from, direction, distance) => {
      const x = from.x + direction.x * distance, z = from.z + direction.z * distance, margin = size.length / 2
      const inChurch = x > church.min.x - margin && x < church.max.x + margin && z > church.min.z - margin && z < church.max.z + margin
      const inTrunk = trunks.some(({ min, max }) => x > min.x - margin && x < max.x + margin && z > min.z - margin && z < max.z + margin)
      return inChurch || inTrunk || this.comrades.some(comrade => comrade.alive && Math.hypot(comrade.x - x, comrade.z - z) < size.length)
    }
    this.player = new Character({ ...postAt(posts.player), yaw: posts.player.yaw, pitch: posts.player.pitch, y: .89, size,
      strikeHeight, actions: { attack: .1 }, pitchRange: { min: -Math.PI / 6, max: Math.PI / 2.5 }, targets: this.targets,
      groundAt, isBlocked, obstacleAt: this.obstacleAt, bounds: { min: { x: -inside.x, z: -inside.z }, max: inside } })
    const layout = inputLayouts.firstPerson
    const input = new Input({ ...layout, ...layout.buttonDict && { buttonDict: { ...layout.buttonDict, special: icons.sneak } } })
    const canFire = () => !this.playerWalk.waitingToStand
    this.trigger = new TriggerKeys(this.player, { get attack() {
      return canFire() && input.attack
    } }, new Firearm(firearms.rifle))
    this.playerWalk = new YardWalk(this.player, input, { reloading: () => this.trigger.firearm.reloading,
      nearWall: body => Math.min(yard.length / 2 - Math.abs(body.x), yard.width / 2 - Math.abs(body.z)) < 1.65 })
    this.weaponView = new WeaponView(this.player, () => this.trigger.firearm, {
      rifle: resistanceFighter.twoHandedWeapon, machineGun: sovietPartisan.twoHandedWeapon,
    })
    this.session.scope.add(() => this.disposeScene(this.weaponView.scene))
    this.controllers.push(this.playerWalk, new MouseLook(this.player), new TouchLook(this.player), this.trigger)
    const playerModel = new CharacterModel(this.player, { mesh: createPlayerBox({ visible: false }), attackSound: 'rifle.mp3' })
    this.audioPlayer = () => playerModel
    this.add(this.player, playerModel, new FirstPersonView(this.player, { camera: this.camera, weaponSrc: null, behind: 0,
      readiness: () => this.trigger.firearm.readiness }))
  }

  /**
   * A comrade at his post, with the crouch animation already loaded for the Germans.
   */
  placeComrade(post, { figure, look }) {
    const gun = figure === sovietPartisan ? firearms.machineGun : firearms.rifle
    const { reach, damage } = gun
    const mesh = loadedModel(figure.model)
    const crouch = loadedModel(coverSoldierModels[0]).userData.animations.find(clip => clip.name === crouchAnimation)
    const body = makeCharacterBody(mesh, figure.animDict, figure.body, { ...postAt(post, comradeInset), yaw: post.yaw, walks: false,
      targets: this.targets, strikeHeight, reach, damage, pitchRange: { min: -Math.PI / 6, max: Math.PI / 2.5 },
      groundAt, obstacleAt: this.obstacleAt })
    if (gun.automatic) body.actions.attack = .21
    const defender = new YardDefender(body, { enemies: this.enemies, gun, sees: this.sees })
    const model = new YardComradeModel(body, { mesh, animations: [...mesh.userData.animations, crouch],
      animDict: { ...figure.animDict, crouch: crouchAnimation },
      twoHandedWeapon: loadedModel(figure.twoHandedWeapon), attackSound: figure.attackSound }, defender.posture.standingHeight)
    figure.dress?.(model.mesh)
    if (look) dressFighter(model.mesh, look.outfit, this.outfits, look.hatColor)
    this.controllers.push(defender)
    this.add(body, model)
    return body
  }

  /** The churchyard's wall of old stone all round, broken only by the gate in its west side, which sandbags bar. */
  buildYardWall() {
    const material = stoneWallMaterial()
    const { length, width, gate } = yard
    const { height, thickness } = yard.wall
    const blocks = []
    const side = (span, x, z, alongZ) => {
      const wall = createStoneWall({ length: span, height, thickness, material })
      wall.position.set(x, 0, z)
      if (alongZ) wall.rotation.y = Math.PI / 2
      this.addMesh(wall)
      blocks.push(wall)
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
    return [...blocks, sandbags.mesh]
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
      } while (this.houseAt(x, z, covers.width[1]) || craters.some(pit => Math.hypot(x - pit.x, z - pit.z) < pit.radius + 2) || (
        x > westApproach.min.x - covers.width[1] && x < westApproach.max.x + covers.width[1]
          && z > westApproach.min.z - covers.width[1] && z < westApproach.max.z + covers.width[1]))
      const height = randFloat(...covers.height)
      const heap = createRockPile({ width: randFloat(...covers.width), height, material: this.rock })
      heap.position.set(x, groundAt(x, z), z)
      this.addMesh(heap)
      return { x, z, height, taken: false }
    })
  }

  /** How far a shot travels before a solid object or an exposed wall stops it. */
  obstacleAt = (from, direction, reach) => {
    let distance = Math.min(reach, ...this.shotBlocks.map(block => rayBoxEntry(from, direction, block) ?? Infinity))
    for (const { mesh, box } of this.surfaceBlocks) {
      const entry = rayBoxEntry(from, direction, box)
      if (entry === null || entry >= distance) continue
      this.ruinRay.set(from, direction)
      this.ruinRay.far = distance
      distance = this.ruinRay.intersectObject(mesh)[0]?.distance ?? distance
    }
    return distance
  }

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
    this.session.gameplay.after(secondWaveAt, () => {
      this.wave++
      this.ui.showMessage(messages.secondWave)
      this.sendWave()
    })
    this.session.gameplay.after(reliefAt, () => this.sendRelief())
  }

  /** The next wave's vees, one after another, flying over the town from either side. */
  sendWave() {
    const wave = waves[this.wave]
    if (this.wave === 0) {
      this.ui.showMessage(messages.firstWave)
      this.session.gameplay.after(4, () => this.add(new Dfs230(groundAt)))
    }
    for (const pass of wave.passes)
      this.session.gameplay.after(pass.at, () => this.sendVee(wave, pass))
  }

  addBombSmoke(wrecks) {
    for (const [i, { min, max, base }] of wrecks.slice(0, 3).entries()) {
      const opacity = .26 + i * .025
      const plume = new Smoke({ num: 22, size: 3.1 + i * .4, color: 0x554c44, opacity, minRadius: .3, maxRadius: 1.25,
        minVelocity: .7, maxVelocity: 1.35, min: -11, max: 0 })
      const { mesh } = plume
      mesh.position.set((min.x + max.x) / 2, base + .65, (min.z + max.z) / 2)
      mesh.rotation.z = .23
      mesh.frustumCulled = false
      this.add({ mesh, update: (dt, t) => {
        plume.update(dt, t, { rotateY: 0 })
        mesh.material.opacity = opacity * (1 - .77 * THREE.MathUtils.smoothstep(this.session.clock.now, 21, secondWaveAt + 9))
      } })
    }
  }

  sendRelief() {
    this.relief = comrades.slice(1).map(({ figure, look }, i) => {
      const { body, model } = makeCharacter(figure, { x: reliefStart - i * 1.5, z: (i - 1) * 1.5,
        yaw: 0, solid: false, groundAt })
      dressFighter(model.mesh, look.outfit, this.outfits, look.hatColor)
      body.steer({ ahead: 1, running: true })
      this.add(body, model)
      return body
    })
    this.reliefColumn.follow(this.relief[0])
    this.ui.showMessage(messages.relief)
  }

  welcomeRelief() {
    this.reliefArrived = true
    this.relief.forEach(body => body.steer())
    this.victory(messages.victory, messages.victoryTitle)
    optionalEffect(this, 'Lika brigade voice', () => {
      const speech = globalThis.speechSynthesis
      const voice = speech?.getVoices().find(({ lang, localService }) => localService && /^(sr|hr|bs)(-|$)/i.test(lang))
      if (!voice || config.volume <= 0) return
      const shout = new SpeechSynthesisUtterance(messages.victoryTitle)
      shout.voice = voice
      shout.volume = config.volume
      speech.speak(shout)
    })
  }

  render() {
    if (this.reliefArrived) {
      this.camera.position.set(-yard.length / 2 + 2, 5.2, 6.5)
      this.camera.lookAt(reliefLine - 6, 1.2, 0)
    }
    super.render()
    if (this.weaponView && !this.reliefArrived && !this.player.dead) this.weaponView.render(this.renderer, this.camera.aspect)
  }

  sendVee(wave, pass) {
    for (const transport of formationFor(wave, pass)) {
      const body = new Transport({ ...transport, groundAt })
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
          drift: { x: -wind, z: THREE.MathUtils.randFloatSpread(wind) } })
        const picture = parachutistArt.pictures[Math.floor(Math.random() * parachutistArt.pictures.length)]
        this.enemies.push(body)
        this.add(body, new ParachutistSprite(body, { texture: this.textures.get(picture) }))
      }
  }

  /** A paratrooper on the ground goes on as a soldier on foot: the living one to his `fightingPlace`. */
  landJumpers() {
    for (const body of this.enemies) {
      if (!(body instanceof Parachutist) || body.handedOver || body.feet > groundAt(body.x, body.z)) continue
      body.handedOver = true
      const { x, z } = this.besideHouse(body.x, body.z)
      const soldier = new DrvarSoldier({ x, z, y: groundAt(x, z) + coverSoldier.size.height / 2 })
      this.enemies.push(soldier)
      this.add(soldier, new CoverSoldierModel(soldier, { flashPicture: this.textures.get(flash.picture), front: this.player, viewer: this.player }))
      if (body.dead) {
        soldier.setState('dead')
        continue
      }
      const { burst, rise } = waves[this.wave]
      this.controllers.push(new YardAttacker(soldier, { targets: this.partisans, range: fireRange, burst, rise,
        sees: this.canOpenFire, clearShot: this.clearEnemyShot }))
      const inSight = spot => this.sees({ x: spot.x, y: groundAt(spot.x, spot.z) + eyeHeight, z: spot.z },
        this.playerWalk.posture.standingEye)
      const place = fightingPlace(soldier, { spots: this.coverSpots, target: this.player, range: fireRange, reach: covers.reach,
        behind: covers.behind, inSight, onReserve: spot => {
          soldier.coverSpot = spot
        } })
      if (!place) continue
      const goal = place.cover ? place : this.besideHouse(place.x, place.z)
      const route = this.streets.route(soldier, goal)
      if (route) soldier.moveTo(goal, route)
      else this.releaseCover(soldier)
    }
  }

  canOpenFire = (from, to) => {
    const { fireLimit } = waves[this.wave]
    let firing = 0
    for (const enemy of this.enemies) {
      if (enemy.alive && (enemy.state === 'aim' || enemy.state === 'attack')) firing++
      if (firing >= fireLimit) return false
    }
    return this.clearEnemyShot(from, to)
  }

  clearEnemyShot = (from, to) =>
    this.sees({ x: from.x, y: groundAt(from.x, from.z) + eyeHeight, z: from.z }, to.eye)

  releaseCover(soldier) {
    if (!soldier.coverSpot) return
    soldier.coverSpot.taken = false
    soldier.coverSpot = null
  }

  /** Hand over the gun only if its defender has fallen. */
  takeMachineGun() {
    const [gunner] = this.comrades
    if (!gunner.dead || this.trigger.firearm.automatic) return
    this.trigger.equip(new Firearm(firearms.machineGun))
    this.ui.showMessage(messages.machineGun)
  }

  update(dt, t) {
    super.update(dt, t)
    this.reliefColumn?.update(dt)
    for (const enemy of this.enemies)
      if (enemy.dead && enemy.coverSpot) this.releaseCover(enemy)
    this.dropJumpers()
    this.landJumpers()
    this.targets.length = 0
    this.targets.push(...this.enemies.filter(enemy => enemy.alive && enemy.exposed !== false))
    if (this.player.dead) return this.defeat(messages.defeat)
    if (this.session.state !== 'running') return
    if (this.comrades[0].dead) this.takeMachineGun()
    this.weaponView?.update(dt)
    if (this.relief?.[0].x >= reliefLine) this.welcomeRelief()
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
          <br><small>${weaponNames[weaponKind(firearm)]} · ${ammo}</small>
        </div>
      </div>
    `
  }
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
