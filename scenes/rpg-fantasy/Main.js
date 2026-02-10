import Scena3D from '/core/Scena3D.js'
import { createHillyTerrain } from '/core3d/ground.js'
import { createTreesOnTerrain } from '/core3d/geometry/trees.js'
import { createSun } from '/core3d/light.js'
import { sample, getEmptyCoords, putOnSolids } from '/core3d/helpers.js'
import { loadModel } from '/core3d/loaders.js'
import { thirdPersonControls } from '/ui/Controls.js'

const mapSize = 400

const messageDict = {
  1: 'You just killed the first Orc.<br>Middle Earth shall be free!',
  10: 'You killed half the vile creatures',
  19: 'You smell victory in the air...',
}

const customStartScreen = /* html */`
  <div class="central-screen rpgui-container framed">
      <ul><li>Kill all the Orcs</li></ul>
      <button id="start">Press to START!</button>
      <p>Free the land<br>from their vile presence!</p>
  </div>
`

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      controlKeys: thirdPersonControls, // dodati special
      customStartScreen,
      uiStyle: 'rpg',
    })
    this.score = 0
  }

  async init() {
    this.camera.position.set(0, 50, 150)

    const sun = createSun({ pos: [15, 100, 50], intensity: 2 * Math.PI })
    const terrain = await createHillyTerrain({ size: mapSize, factorY: 30 })
    const trees = createTreesOnTerrain({ terrain })
    this.addMesh(sun, terrain, trees)

    const coords = getEmptyCoords({ mapSize: mapSize * .9, fieldSize: 5 })

    const castle = await loadModel({ file: 'building/castle/fortress.fbx', size: 40 })
    putOnSolids(castle, terrain, -5)
    this.addMesh(castle)

    const solids = [terrain, castle]

    const { BarbarianPlayer } = await import('/core3d/actor/derived/fantasy/Barbarian.js')
    this.player = new BarbarianPlayer({ pos: coords.pop(), mapSize, solids, camera: this.camera, cameraClass: 'rpgui-button', rpgStyle: true })
    this.add(this.player)

    for (let i = 0; i < 20; i++) {
      const name = sample(['Orc', 'OrcOgre'])
      const obj = await import(`/core3d/actor/derived/fantasy/${name}.js`)
      const Enemy = obj[name + 'AI']
      const enemy = new Enemy({ pos: coords.pop(), target: this.player.mesh, mapSize, solids, shouldRaycastGround: true, deathCallback: () => this.showMotivationalMessage() })
      this.add(enemy)
    }

    const Potion = await import('/core3d/objects/Potion.js')
    for (let i = 0; i < 3; i++) {
      const potion = new Potion.default({ pos: coords.pop(), solids })
      this.addMesh(potion.mesh)
    }

    const Monument = await import('/core3d/objects/Monument.js')
    const monument = new Monument.default({ pos: coords.pop(), solids: terrain })
    this.addMesh(monument.mesh)

    const { FlamingoAI } = await import('/core3d/actor/derived/Flamingo.js')
    for (let i = 0; i < 10; i++) {
      const bird = new FlamingoAI({ mapSize, pos: coords.pop() })
      this.add(bird)
    }

    const Cloud = await import('/core3d/objects/Cloud.js')
    for (let i = 0; i < 5; i++) {
      const cloud = new Cloud.default({ mapSize, pos: coords.pop() })
      this.add(cloud)
    }

    const { ZeppelinAI } = await import('/core3d/actor/derived/Zeppelin.js')
    const airship = new ZeppelinAI({ mapSize, solids: terrain })
    this.add(airship)
  }

  showMotivationalMessage() {
    this.score ++
    const message = messageDict[this.score]
    if (message) this.ui.showMessage(message)
  }

  /* LOOP */

  sceneUI() {
    this.left = this.player.enemies.length - this.score
    return /* html */`
      <div class="top-left rpgui-button golden">
        <div> 
          Score: ${this.score}<br>
          <small>Orcs left: ${this.left}</small>
        </div>
      </div>
    `
  }

  update(dt, t) {
    super.update(dt, t)

    if (this.left === 0) this.victory()
  }
}
