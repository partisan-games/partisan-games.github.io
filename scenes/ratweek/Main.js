import * as THREE from 'three'
import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import { baseControls } from '/ui/Controls.js'
import { attackLabels, keys } from '/core/io/keys.js'
import Input from '/core/io/Input.js'
import WarplaneKeys from '/core/gameplay/controllers/WarplaneKeys.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import GunTurrets from '/core/gameplay/bodies/aircraft/GunTurrets.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import makeInterceptor from '/core3d/actor/aircraft/makeInterceptor.js'
import ProjectilesModel from '/core3d/actor/ProjectilesModel.js'
import { description as fighterPlane, models as fighterModels } from '/core3d/aircraft/derived/Messerschmitt.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { requestModels } from '/core3d/assets/models.js'
import { createLandmark, landmarkModels } from './utils.js'
import { createLandPiece, trackModel } from './landscape.js'
import { landmarks } from './route.js'
import customStartScreen, { planes } from './startScreen.js'

const { randFloatSpread } = THREE.MathUtils

const totalTime = 150
const mapSize = 800
/** How far ahead, in metres of the route, what stands on it comes into being, in the haze at the end of the view. */
const buildingDistance = mapSize * .4
/** The land is made in pieces `piece` metres long, from `behind` the plane to `ahead` of it. */
const land = { piece: 100, ahead: 460, behind: 260 }
const endDelay = 2.5 // seconds between the end of the flight and the end screen
/** Seconds of game time before the first enemy fighter, and between one shot down and the next. */
const fighterWaits = { first: 12, next: 18 }
/** What the bomber is sent to destroy (owner, 2026-11-27); the other buildings are not its targets. */
const missionTargets = ['factory', 'bridge', 'train']
/**
 * The chase camera: `above` (here below, as it is negative) and `behind` the plane, in metres, looking at a point
 * `ahead` of it and `below` it, so the plane sits high in the picture, its underside in view, over the ground it
 * attacks (owner's decision, 2026-11-26).
 */
const chaseView = { above: -1.5, behind: 16, ahead: 25, below: 6 }
/**
 * The aim on the ground: a ring of `radius` metres, `width` thick, `lift` above the ground so it is not hidden; farther
 * from the camera than `readableAt` metres it grows with the distance, so it keeps its size on the screen.
 */
const aimRing = { radius: 4, width: .6, lift: .3, color: 0xff7a1a, opacity: .8, readableAt: 40 }

/** The ring that marks the aim, lying on the ground; it has no outline and the haze does not fade it. */
function createAimMark() {
  const { radius, width, color, opacity } = aimRing
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
    fog: false })
  material.userData.outlineParameters = { visible: false }
  const mark = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 48), material)
  mark.rotation.x = -Math.PI / 2
  mark.visible = false
  return mark
}

export default class WarplaneScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...baseControls, [attackLabels[inputLayouts.warplane.attackKey]]: 'rockets', [keys.attack2.label]: 'machine guns' },
      customStartScreen,
      reportText: 'Yugoslavia, September 1944\n\nGerman troops from Greece rush north to stop the liberation of Belgrade. Your task is to bomb the railways and bridges in their way.',
    })
  }

  async init() {
    this.buildings = []
    this.audioWorldOffset = { x: 0, y: 0, z: 0 }
    /** Metres of the route flown, the pieces of land on it, and the ground among them that shots strike. */
    this.travelled = 0
    this.landPieces = []
    this.grounds = []
    this.landEnd = -land.behind
    this.landmarks = landmarks()
    this.nextLandmark = 0

    this.camera.position.set(0, 29, 0)
    this.scene.fog = new THREE.Fog(0xE5C5AB, mapSize * .25, buildingDistance)
    this.addMesh(createSun({ pos: [50, 200, 50], intensity: Math.PI * 2 }))

    this.score = 0
    this.sinceEnd = 0
    /** The enemy fighters, the bodies the bomber's guns aim at, and each with its views. */
    this.fighters = []
    this.fighterParts = []
    this.fighterWait = new Cooldown({ seconds: fighterWaits.next, clock: this.session.clock })
    await requestModels([trackModel])
    if (this.ui.ended) return
    this.extendLand()
  }

  /** Lays the land of the route ahead of the plane, piece by piece, to `land.ahead` metres. */
  extendLand() {
    while (this.landEnd < this.travelled + land.ahead) {
      const piece = createLandPiece(this.landEnd, this.landEnd + land.piece)
      piece.group.position.z = this.travelled - this.landEnd
      piece.to = this.landEnd + land.piece
      this.landPieces.push(piece)
      this.grounds.push(piece.ground)
      this.addMesh(piece.group)
      this.landEnd = piece.to
    }
  }

  /** The land comes at the plane as it flies; a piece left `land.behind` metres behind it is taken away. */
  moveLand(deltaSpeed) {
    for (const piece of [...this.landPieces]) {
      piece.group.position.z += deltaSpeed
      if (piece.to > this.travelled - land.behind) continue
      this.landPieces.splice(this.landPieces.indexOf(piece), 1)
      this.grounds.splice(this.grounds.indexOf(piece.ground), 1)
      this.scene.remove(piece.group)
      piece.dispose()
    }
    this.extendLand()
  }

  handleClick(e) {
    if (e.target.tagName === 'INPUT' && planes.some(({ id }) => id === e.target.id)) this.play(e.target.id)
  }

  async prepare(plane) {
    const { models, description } = await import(`/core3d/aircraft/derived/${plane}.js`)
    await requestModels([...models, ...fighterModels, ...landmarkModels])
    if (this.ui.ended) return
    const { impactAt } = worldQueries(this.grounds)
    const groundAt = (x, z) => {
      for (const piece of this.landPieces) {
        const height = piece.heightAt(x, z)
        if (height !== undefined) return height
      }
      return 0
    }
    Object.assign(this, { groundAt, impactAt })
    const { body, model } = makeWarplane(description,
      { clock: this.session.clock, limit: mapSize * .25, groundAt, targets: this.buildings.map(({ body }) => body) }, { impactAt })
    this.player = body
    this.guns = new GunTurrets({ plane: body, targets: this.fighters, clock: this.session.clock, turrets: description.turrets })
    this.add(this.guns, new ProjectilesModel(this.guns, { shotSound: 'aircraft-gun.mp3' }))
    this.fighterWait.start(fighterWaits.first)
    this.controllers.push(new WarplaneKeys(body, new Input(inputLayouts.warplane), this.guns))
    this.audioPlayer = () => model
    // the camera flies behind the plane, never turning with it
    const chase = new ChaseCamera({ camera: this.camera, mesh: model.mesh, rotate: false, speed: body.speed * .75,
      offset: [0, chaseView.above, chaseView.behind], lookAt: [0, -chaseView.below, -chaseView.ahead] })
    chase.far = mapSize * .5
    this.chase = chase
    this.aimMark = createAimMark()
    this.addMesh(this.aimMark)
    this.add(body, model, { update: () => this.followPlane() })
  }

  /** The mark on the ground where a missile fired now would strike, while the plane can fire. */
  showAim() {
    const { player, aimMark } = this
    const aim = player.alive && !player.landing && player.aim()
    aimMark.visible = Boolean(aim)
    if (!aim) return
    aimMark.position.set(aim.x, aim.y + aimRing.lift, aim.z)
    aimMark.scale.setScalar(Math.max(1, this.camera.position.distanceTo(aimMark.position) / aimRing.readableAt))
  }

  /** The camera keeps to the plane; down on the ground, it rises and draws back to see it roll to a stop. */
  followPlane() {
    this.showAim()
    const { player, chase } = this
    if (player.landing && !player.airborne) {
      chase.offset[1] = player.size.height * 1.5
      chase.offset[2] = player.size.length * 1.5
    }
    chase.alignCamera()
  }

  start() {
    super.start()
    this.ui.showMessage('Destroy bridges, trains and factories.<br><br>Do not hit civilian houses.')
  }

  /** What stands on the route comes into being, in its order, once it is `buildingDistance` ahead of the plane. */
  addLandmarks() {
    while (this.landmarks[this.nextLandmark]?.u < this.travelled + buildingDistance) {
      const thing = this.landmarks[this.nextLandmark++]
      const building = createLandmark(thing, { clock: this.session.clock, targets: [this.player] })
      const { body, model } = building
      Object.assign(body, { x: thing.x, z: this.travelled - thing.u })
      building.counted = false
      this.buildings.push(building)
      this.player.targets.push(body)
      this.add(body, model)
    }
  }

  /** A Bf 109 comes at the bomber from ahead, out of the haze, and makes pass after pass at it. */
  addFighter() {
    const { body, model, guns } = makeInterceptor(fighterPlane, {
      target: this.player, clock: this.session.clock, groundAt: this.groundAt,
      x: randFloatSpread(mapSize * .2), y: this.player.y + 15, z: -buildingDistance * .8,
    }, { impactAt: this.impactAt })
    this.fighters.push(body)
    this.fighterParts.push({ body, model, guns, counted: false })
    this.add(body, model, guns)
  }

  /** A fighter shot down lies on the ground that comes at the plane, and is gone once behind it; each one scores. */
  moveFighters = deltaSpeed => [...this.fighterParts].forEach(fighter => {
    const { body, model, guns } = fighter
    if (body.alive) return
    if (!fighter.counted) {
      fighter.counted = true
      this.score++
      this.fighterWait.start(fighterWaits.next)
    }
    if (!body.airborne) body.z += deltaSpeed
    if (body.z <= this.camera.position.z + 200) return
    this.fighterParts.splice(this.fighterParts.indexOf(fighter), 1)
    this.fighters.splice(this.fighters.indexOf(body), 1)
    this.remove(body, model, guns)
    model.end()
  })

  /** Buildings come at the plane with the ground and are gone once behind it. */
  moveBuildings = deltaSpeed => [...this.buildings].forEach(building => {
    const { body, model } = building
    body.z += deltaSpeed
    if (body.z <= this.camera.position.z + 200) return
    this.buildings.splice(this.buildings.indexOf(building), 1)
    this.player.targets.splice(this.player.targets.indexOf(body), 1)
    this.remove(body, model)
    model.end()
  })

  /** A destroyed factory, bridge or train scores, a destroyed civil building costs a point. */
  countDestroyed() {
    for (const building of this.buildings) {
      if (building.counted || building.body.alive) continue
      building.counted = true
      if (missionTargets.includes(building.body.kind)) this.score++
      if (building.body.kind === 'civil') {
        this.ui.showMessage('No! Destruction of civilian buildings is a war crime.')
        this.score--
      }
    }
  }

  /** Shows the end screen once, after the plane has had time to crash or land. */
  finishAfterDelay(delta, finish) {
    if (this.ui.outro) return
    this.sinceEnd += delta
    if (this.sinceEnd >= endDelay) finish()
  }

  sceneUI(time) {
    const timeLeft = totalTime - Math.floor(time)
    return this.ui.scoreUI('Score', this.score, 'Time left', Math.max(timeLeft, 0), 'blink')
  }

  update(delta, time) {
    // the world comes at the plane first, so the models drawn this frame stand where their bodies and the land are
    const deltaSpeed = this.player.speed * delta
    this.audioWorldOffset.z -= deltaSpeed
    this.travelled += deltaSpeed
    this.moveLand(deltaSpeed)
    this.moveBuildings(deltaSpeed)
    this.moveFighters(deltaSpeed)
    super.update(delta, time)
    this.countDestroyed()

    if (this.player.dead)
      return this.finishAfterDelay(delta, () => this.defeat('You have failed.'))

    this.addLandmarks()
    if (time < totalTime - 10 && this.fighterWait.ready && !this.fighters.some(fighter => fighter.alive)) this.addFighter()
    if (time >= totalTime) {
      this.player.setState('land')
      this.finishAfterDelay(delta, () => this.victory('You have completed the mission.'))
    }
  }
}
