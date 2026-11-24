import * as THREE from 'three'
import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import { createTerrain, meadowColor } from '/core3d/ground.js'
import { createFirTree } from '/core3d/geometry/trees.js'
import { baseControls } from '/ui/Controls.js'
import { attackLabels } from '/core/io/keys.js'
import { icons } from '/core/io/icons.js'
import Input from '/core/io/Input.js'
import WarplaneKeys from '/core/gameplay/controllers/WarplaneKeys.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { requestModels } from '/core3d/assets/models.js'
import { createBuilding } from './utils.js'
import { assets } from '/config.js'

const { randFloatSpread } = THREE.MathUtils

const totalTime = 150
const mapSize = 800
const buildingInterval = 2 // seconds of game time
const buildingDistance = mapSize * .4
const groundDistance = mapSize * .99
const endDelay = 2.5 // seconds between the end of the flight and the end screen
const planes = ['Bomber']
/** A plane has nothing to jump, so it fires on Space. */
const inputOptions = { attackKey: 'Space', buttonDict: { attack: icons.shoot } }

const customStartScreen = ({ container }) => {
  const options = planes
    .map(name => `<span data-paid><input type="image" id="${name}" src="${assets.images}scenes/warplane/${name}.webp" /></span>`)
    .join('')

  return /* html */`
    <div class="central-screen ${container}">
        <h2>Choose your aircraft</h2>
        <div class="game-screen-select">
            ${options}
        </div>
    </div>
`
}

export default class WarplaneScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot' },
      customStartScreen
    })
  }

  init() {
    this.i = 0
    this.buildingWait = new Cooldown({ seconds: buildingInterval, clock: this.session.clock })
    this.buildings = []
    this.audioWorldOffset = { x: 0, y: 0, z: 0 }
    this.objects = []

    this.camera.position.set(0, 29, 0)
    this.scene.fog = new THREE.Fog(0xE5C5AB, mapSize * .25, buildingDistance)
    this.addMesh(createSun({ pos: [50, 200, 50], intensity: Math.PI * 2 }))

    const groundParams = { size: mapSize, color: meadowColor, colorRange: .1, segments: 50, min: 0, max: 15 }
    this.ground = createTerrain(groundParams)
    this.ground2 = createTerrain(groundParams)
    this.ground2.position.z = -groundDistance
    this.addMesh(this.ground, this.ground2)

    this.score = 0
    this.sinceEnd = 0
  }

  handleClick(e) {
    if (e.target.tagName === 'INPUT' && planes.includes(e.target.id)) this.play(e.target.id)
  }

  async prepare(plane) {
    const { models, description } = await import(`/core3d/aircraft/derived/${plane}.js`)
    await requestModels(models)
    if (this.ui.ended) return
    const { groundAt } = worldQueries([this.ground, this.ground2])
    const { body, model } = makeWarplane(description,
      { clock: this.session.clock, limit: mapSize * .25, groundAt, targets: this.buildings.map(({ body }) => body) })
    this.player = body
    this.controllers.push(new WarplaneKeys(body, new Input(inputOptions)))
    this.audioPlayer = () => model
    // the camera flies behind the plane, never turning with it
    const { length, height } = body.size
    const chase = new ChaseCamera({ camera: this.camera, mesh: model.mesh, rotate: false, speed: body.speed * .75,
      offset: [0, 0, length], lookAt: [0, 0, 0], birdsEyeOffset: [0, height * 12, 0], birdsEyeLookAt: [0, 0, -length] })
    chase.far = mapSize * .5
    this.chase = chase
    this.add(body, model, { update: () => this.followPlane(), end: () => chase.end() })
  }

  /** The camera keeps to the plane; down on the ground, it rises and draws back to see it roll to a stop. */
  followPlane() {
    const { player, chase } = this
    if (player.landing && !player.airborne) {
      chase.offset[1] = player.size.height * 1.5
      chase.offset[2] = player.size.length * 1.5
    }
    chase.alignCamera()
  }

  start() {
    super.start()
    this.ui.showMessage('Destroy enemy factories,<br><br>do not target civilian buildings')
  }

  pushMesh(mesh, spread = .33) {
    mesh.position.copy({ x: randFloatSpread(mapSize * spread), y: 0, z: -buildingDistance })
    this.addMesh(mesh)
    this.objects.push(mesh)
  }

  async addBuilding(time) {
    const building = await createBuilding(time, { clock: this.session.clock, targets: [this.player] })
    if (!this.session.active) return // the game ended while the building was made
    const { body, model } = building
    Object.assign(body, { x: randFloatSpread(mapSize * .33), z: -buildingDistance })
    building.counted = false
    this.buildings.push(building)
    this.player.targets.push(body)
    this.add(body, model)
  }

  addTree = () => this.pushMesh(createFirTree(), .4)

  spawnObjects(time) {
    if (this.i++ % 5 === 0) this.addTree()

    if (this.buildingWait.ready) {
      this.addBuilding(time)
      this.buildingWait.start()
    }
  }

  moveGround = deltaSpeed => [this.ground, this.ground2].forEach(g => {
    g.translateZ(deltaSpeed)
    if (g.position.z >= mapSize * .75) g.position.z = -groundDistance
  })

  moveObjects = deltaSpeed => this.objects.forEach(mesh => {
    mesh.translateZ(deltaSpeed)
    if (mesh.position.z > this.camera.position.z + 200) {
      this.objects.splice(this.objects.indexOf(mesh), 1)
      this.scene.remove(mesh)
    }
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

  /** A destroyed factory scores, a destroyed civil building costs a point. */
  countDestroyed() {
    for (const building of this.buildings) {
      if (building.counted || building.body.alive) continue
      building.counted = true
      if (building.body.kind === 'factory') this.score++
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
    super.update(delta, time)
    const deltaSpeed = this.player.speed * delta
    this.audioWorldOffset.z -= deltaSpeed

    this.moveGround(deltaSpeed)
    this.moveObjects(deltaSpeed)
    this.moveBuildings(deltaSpeed)
    this.countDestroyed()

    if (this.player.dead)
      return this.finishAfterDelay(delta, () => this.defeat('You have failed.'))

    if (time < totalTime - 10) this.spawnObjects(time)
    if (time >= totalTime) {
      this.player.land()
      this.finishAfterDelay(delta, () => this.victory('You have completed the mission.'))
    }
  }
}
