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
import { formationFor, reliefAt, waves, wind } from './assault.js'
import placeWarTraces, { models as warTraceModels } from './warTraces.js'
import { morningHaze, openingPost, placeRuins, placeTrees, ridgeTrees, treeModels } from './scenery.js'
import Streets from './Streets.js'
import ReliefColumn, { columnDepth } from './ReliefColumn.js'
import WeaponView from './WeaponView.js'
import { keys } from '/core/io/keys.js'
import { crouchHeight, YardAttacker, YardDefender, YardWalk } from './yardCover.js'
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
import Corpses from '/core3d/actor/Corpses.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { description as sovietPartisan, models as sovietPartisanModels } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { description as resistanceFighter, models as resistanceFighterModels } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { description as partisanLowpoly, models as partisanLowpolyModels } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import Church, { models as churchModels } from '/core3d/actor/buildings/Church.js'
import Sandbags, { models as sandbagsModels } from '/core3d/actor/buildings/Sandbags.js'
import { models as townHouseModels } from '/core3d/actor/buildings/TownHouse.js'
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

const reliefLeaders = [
  { figure: resistanceFighter, look: variants.vuna },
  { figure: partisanLowpoly, look: variants.smedji },
  { figure: resistanceFighter, look: variants.brkovi },
]

export const yardDefenders = [
  { figure: sovietPartisan, post: { x: 1, z: -.4, yaw: 0 } },
  { ...reliefLeaders[0], post: { x: 0, z: -1, yaw: Math.PI / 2 } },
  { ...reliefLeaders[1], post: { x: 0, z: 1, yaw: -Math.PI / 2 } },
  { ...reliefLeaders[2], post: { x: -1, z: .4, yaw: Math.PI } },
  { figure: resistanceFighter, look: variants.oker, post: { x: 1, z: .68, yaw: 0 } },
  { figure: resistanceFighter, look: variants.indigo, post: { x: .66, z: -1, yaw: Math.PI / 2 } },
  { figure: partisanLowpoly, look: variants.maslinasti, post: { x: -1, z: -.62, yaw: Math.PI } },
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
    super({ usePointerLock: true, controlKeys: { ...fpsControls, [keys.crouch.label]: 'hold to crouch' },
      intro: messages.intro, reportText: messages.report })
  }

  async init() {
    const pictures = [parachutistArt.picture, flash.picture]
    const [textures] = await Promise.all([
      Promise.all(pictures.map(loadPixelArt)).then(loaded => new Map(pictures.map((src, i) => [src, loaded[i]]))),
      requestModels([...sovietPartisanModels, ...resistanceFighterModels, ...partisanLowpolyModels, ...churchModels, ...sandbagsModels, ...ju52Models,
        ...coverSoldierModels, ...townHouseModels, ...warTraceModels, ...drvarPropModels, ...treeModels]),
    ])
    // a newer start ended this scene while its pictures loaded: they are its alone, so it frees them
    if (!this.session.active) return textures.forEach(texture => texture.dispose())
    this.textures = textures
    this.backgroundColor = morningHaze
    this.scene.fog = new THREE.Fog(morningHaze, 62, 315)
    hemLight({ intensity: 1.07, skyColor: 0xd2e0ef, groundColor: 0x77715f, scene: this.scene })
    const shadowFocus = new THREE.Object3D()
    shadowFocus.position.set(13, 0, 0)
    this.scene.add(shadowFocus)
    const sun = dirLight({ scene: this.scene, target: shadowFocus, pos: [-33, 47, 42],
      color: 0xffdfb0, intensity: 1.74, area: 43, mapSize: 1024 })
    sun.shadow.normalBias = .035
    sun.shadow.bias = -.00022
    sun.shadow.camera.far = 175
    sun.shadow.camera.updateProjectionMatrix()
    this.rock = rockMaterial(createTexture({ file: 'terrain/rocks.jpg' }))
    this.addMesh(createMorningSky(), createTerrain(), ...createUnac(), createCave(), createPanorama())
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
    this.addBombSmoke(traces.fires)
    this.footprints = [...occupied, ...outdoorTrunks]
    const churchFootprint = { min: churchBox.min, max: churchBox.max, height: churchBox.max.y }
    // Use wall surfaces for the yard and ruined houses so shots follow visible gaps and changes in height.
    this.shotBlocks = [...town.footprints, ...outdoorTrunks, ...yardTrunks, churchFootprint].map(blockOf)
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
    this.comrades = yardDefenders.map(defender => this.placeComrade(defender.post, defender))
    this.reliefColumn = new ReliefColumn(partisanLowpoly, variants.smedji.outfit, this.outfits)
    this.addMesh(this.reliefColumn.mesh)
    this.session.scope.add(() => this.reliefColumn.end())
    this.partisans = [this.player, ...this.comrades]
    this.planes = []
    /** The view of each plane and of each paratrooper in the air, to take away with him once his part is over. */
    this.views = new Map()
    /** The soldiers on foot still standing or falling; one who has come to lie joins the `corpses`. */
    this.soldierViews = new Set()
    this.corpses = new Corpses()
    this.addMesh(this.corpses.mesh)
    this.session.scope.add(() => this.corpses.end())
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
    this.player = new Character({ ...postAt(openingPost), yaw: openingPost.yaw, pitch: openingPost.pitch, y: .89, size,
      strikeHeight, actions: { attack: .1 }, pitchRange: { min: -Math.PI / 6, max: Math.PI / 2.5 }, targets: this.targets,
      groundAt, isBlocked, obstacleAt: this.obstacleAt, bounds: { min: { x: -inside.x, z: -inside.z }, max: inside } })
    const layout = inputLayouts.firstPerson
    const input = new Input({ ...layout, ...layout.buttonDict && { buttonDict: { ...layout.buttonDict, special: icons.sneak } } })
    this.trigger = new TriggerKeys(this.player, input, new Firearm(firearms.rifle))
    this.playerWalk = new YardWalk(this.player, input)
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
    for (const [index, wave] of waves.entries()) {
      if (index === 0) continue
      this.session.gameplay.after(wave.start, () => {
        this.wave = index
        if (index === 1) this.ui.showMessage(messages.secondWave)
        this.sendWave()
      })
    }
    this.session.gameplay.after(reliefAt, () => this.sendRelief())
  }

  /** The next wave's vees, one after another, flying over the town from either side. */
  sendWave() {
    const wave = waves[this.wave]
    if (this.wave === 0) this.ui.showMessage(messages.firstWave)
    for (const pass of wave.passes)
      this.session.gameplay.after(pass.at, () => this.sendVee(wave, pass))
  }

  addBombSmoke(fires) {
    for (const [i, { x, z, base }] of fires.entries()) {
      const opacity = .26 + i * .025
      const plume = new Smoke({ num: 22, size: 3.1 + i * .4, color: 0x554c44, opacity, minRadius: .3, maxRadius: 1.25,
        minVelocity: .7, maxVelocity: 1.35, min: -11, max: 0 })
      const { mesh } = plume
      mesh.position.set(x, base + .65, z)
      mesh.rotation.z = .23
      mesh.frustumCulled = false
      this.add({ mesh, update: (dt, t) => {
        plume.update(dt, t, { rotateY: 0 })
        mesh.material.opacity = opacity * (1 - .77 * THREE.MathUtils.smoothstep(this.session.clock.now, 21, waves[1].start + 9))
      } })
    }
  }

  sendRelief() {
    this.relief = reliefLeaders.map(({ figure, look }, i) => {
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
      const view = new Ju52(body)
      this.planes.push(body)
      this.views.set(body, view)
      this.add(body, view)
    }
  }

  /** A soldier come to lie stays where he fell, drawn among the corpses: his own figure, with its bones, goes. */
  layDead() {
    const lying = [...this.soldierViews].filter(view => view.lying)
    if (!lying.length) return
    this.corpses.add(...lying.map(view => view.mesh))
    for (const view of lying) this.soldierViews.delete(view)
    this.remove(...lying)
  }

  /**
   * A plane that has let all its men go and flown as far past the drop as it came in, out of sight, is gone: nothing
   * left to draw or move. One shot down stays where it fell.
   */
  retirePlanes() {
    for (const plane of [...this.planes]) {
      if (!plane.alive || plane.sent < plane.jumpers || plane.travelled < plane.drop.from + plane.drop.to) continue
      this.planes.splice(this.planes.indexOf(plane), 1)
      this.remove(plane, this.views.get(plane))
      this.views.delete(plane)
    }
  }

  /** Each paratrooper a plane lets go of sinks from where it is, the wind drifting him the same way for all. */
  dropJumpers() {
    for (const plane of this.planes)
      while (plane.sent < plane.jumped) {
        plane.sent++
        const body = new Parachutist({ x: plane.x, y: plane.y - 3, z: plane.z, groundAt,
          drift: { x: -wind, z: THREE.MathUtils.randFloatSpread(wind) } })
        const view = new ParachutistSprite(body, { texture: this.textures.get(parachutistArt.picture) })
        this.enemies.push(body)
        this.views.set(body, view)
        this.add(body, view)
      }
  }

  /**
   * A paratrooper on the ground goes on as a soldier on foot, the living one to his `fightingPlace`; the paratrooper
   * himself, his part over, leaves the game.
   */
  landJumpers() {
    for (const body of this.enemies.filter(enemy => enemy instanceof Parachutist && enemy.feet <= groundAt(enemy.x, enemy.z))) {
      this.enemies.splice(this.enemies.indexOf(body), 1)
      this.remove(body, this.views.get(body))
      this.views.delete(body)
      const { x, z } = this.besideHouse(body.x, body.z)
      const soldier = new DrvarSoldier({ x, z, y: groundAt(x, z) + coverSoldier.size.height / 2 })
      this.enemies.push(soldier)
      const view = new CoverSoldierModel(soldier, { flashPicture: this.textures.get(flash.picture), front: this.player, viewer: this.player })
      this.soldierViews.add(view)
      this.add(soldier, view)
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
    this.retirePlanes()
    this.layDead()
    this.targets.length = 0
    this.targets.push(...this.enemies.filter(enemy => enemy.alive && enemy.exposed !== false))
    if (this.player.dead) return this.defeat(messages.defeat)
    if (this.session.state !== 'running') return
    if (this.comrades[0].dead) this.takeMachineGun()
    this.weaponView?.update(dt)
    if (this.relief?.[0].x >= reliefLine) this.welcomeRelief()
  }

  sceneUI() {
    const remaining = Math.max(0, Math.ceil(reliefAt - this.session.clock.now))
    const minutes = Math.floor(remaining / 60)
    const seconds = String(remaining % 60).padStart(2, '0')
    const reliefStatus = this.reliefArrived ? messages.victoryTitle
      : this.relief ? 'Ličani are approaching' : `Hold until relief · ${minutes}:${seconds}`
    return /* html */`
      <div class="top-left ${currentStyleClasses().score}">
        <div>
          Wave: ${this.wave + 1}
          <br><small>${reliefStatus}</small>
        </div>
      </div>
    `
  }
}

function createMorningSky() {
  const geometry = new THREE.SphereGeometry(810, 32, 16)
  const { position } = geometry.attributes
  const horizon = new THREE.Color(morningHaze), upper = new THREE.Color(0x668ba9)
  const color = new THREE.Color(), colors = []
  for (let i = 0; i < position.count; i++) {
    const height = position.getY(i) / 810
    color.copy(horizon).lerp(upper, THREE.MathUtils.smoothstep(height, .01, .65))
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const sky = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide,
    depthWrite: false, fog: false }))
  sky.renderOrder = -1
  return sky
}

/** Keep the mountain silhouette near the horizon and show the scene's sky above it. */
function createPanorama(radius = 600) {
  const texture = new THREE.TextureLoader().load('/assets/images/background/planine.png')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.x = -1
  const geometry = new THREE.CylinderGeometry(radius, radius, 144, 64, 1, true)
  geometry.translate(0, -6, 0)
  const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xc5d0da, side: THREE.BackSide, alphaTest: .5, fog: false })
  return new THREE.Mesh(geometry, material)
}
