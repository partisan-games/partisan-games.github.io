import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { createTerrain } from '/core3d/ground.js'
import { createFirTree } from '/core3d/geometry/trees.js'
import { baseControls } from '/ui/Controls.js'
import { createBuilding } from './utils.js'
import { Spinner } from '/core3d/loaders.js'

const { randFloatSpread } = THREE.MathUtils

const totalTime = 150
const mapSize = 800
const buildingInterval = 2000
const buildingDistance = mapSize * .4
const groundDistance = mapSize * .99

const createStartScreen = () => {
  const options = ['Biplane', 'Triplane', 'Messerschmitt', 'Bomber', 'F18']
    .map(name => `<input type="image" id="${name}" src="/assets/images/scenes/warplane/${name}.webp" />`)
    .join('')

  return /* html */`
    <div class="central-screen simple-container">
        <h2>Choose your aircraft</h2>
        <div class="game-screen-select">
            ${options}
        </div>
    </div>
`
}

export default class extends Scena3D {
  constructor(manager) {
    super(manager, {
      toon: true,
      controlKeys: { ...baseControls, Enter: 'attack' },
      customStartScreen: createStartScreen()
    })
  }

  init() {
    this.i = 0
    this.last = Date.now()
    this.entities = []
    this.objects = []

    this.camera.position.set(0, 29, 0)
    this.scene.fog = new THREE.Fog(0xE5C5AB, mapSize * .25, buildingDistance)
    this.addMesh(createSun({ pos: [50, 200, 50], intensity: Math.PI * 2 }))

    const groundParams = { size: mapSize, color: 0x91A566, colorRange: .1, segments: 50, min: 0, max: 15 }
    this.ground = createTerrain(groundParams)
    this.ground2 = createTerrain(groundParams)
    this.ground2.position.z = -groundDistance
    this.addMesh(this.ground, this.ground2)

    this.score = 0
    this.render()
  }

  async handleClick(e) {
    super.handleClick(e)
    if (e.target.tagName != 'INPUT') return

    const spinner = new Spinner()
    const obj = await import(`/core3d/aircraft/derived/${e.target.id}.js`)
    this.player = new obj.default({ camera: this.camera, limit: mapSize * .25 })
    this.addMesh(this.player.mesh)
    this.entities.push(this.player)
    spinner.hide()
    this.start()
    this.ui.showMessage('Destroy enemy factories,<br><br>do not target civilian buildings')
  }

  pushMesh(mesh, spread = .33) {
    mesh.position.copy({ x: randFloatSpread(mapSize * spread), y: 0, z: -buildingDistance })
    this.addMesh(mesh)
    this.objects.push(mesh)
  }

  async addBuilding(time) {
    const building = await createBuilding(time)
    this.entities.push(building)
    this.pushMesh(building.mesh)
  }

  addTree = () => this.pushMesh(createFirTree(), .4)

  spawnObjects(time) {
    if (this.i++ % 5 === 0) this.addTree()

    if (Date.now() - this.last >= buildingInterval) {
      this.addBuilding(time)
      this.last = Date.now()
    }
  }

  /* UPDATES */

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

  updateEntities = delta => this.entities.forEach(entity => {
    if (!entity.scene) this.entities.splice(this.entities.indexOf(entity), 1)
    if (entity.damageAmount) {
      if (entity.name == 'factory') this.score++
      if (entity.name == 'civil') {
        this.ui.showMessage('No! Destruction of civilian buildings is a war crime.')
        this.score--
      }
    }
    entity.update(delta)
  })

  sceneUI(time) {
    const timeLeft = totalTime - Math.floor(time)
    return /* html */`
      <div class="top-left">
        <p>
          Score: ${this.score}<br>
          <small class="blink">Time left: ${Math.max(timeLeft, 0)}</small>
        </p>
      </div>
    `
  }

  update(delta, time) {
    super.update(delta, time)
    const deltaSpeed = this.player.speed * delta

    this.moveGround(deltaSpeed)
    this.moveObjects(deltaSpeed)
    this.updateEntities(delta)

    if (this.player.dead)
      return setTimeout(() => this.defeat('You have failed.'), 2500)

    if (time < totalTime - 10) this.spawnObjects(time)
    if (time >= totalTime) {
      this.player.land(delta)
      setTimeout(() => {
        this.victory('You have completed the mission.')
      }, 2500)
    }
  }
}
