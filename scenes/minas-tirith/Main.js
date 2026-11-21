import { keys } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import PolarMaze from '/core3d/mazes/PolarMaze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { createSun, ambLight } from '/core3d/light.js'
import { createHill } from '/core3d/ground.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { description as golem, models as golemModels } from '/core3d/actor/derived/fantasy/Golem.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'

const rows = 20
const cellSize = 10
const mazeSize = rows * cellSize

export default class MinasTirithScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...thirdPersonControls, [keys.jump.label]: '', [keys.attack2.label]: 'secondary attack' },
      toon: true,
    })
  }

  async init() {
    await requestModels([...golemModels])
    const hill = createHill(mazeSize * 2.05, 164)
    this.addMesh(hill)

    ambLight({ intensity: Math.PI * .6, scene: this.scene })
    const sun = createSun({ pos: [50, 150, 200] })
    this.addMesh(sun)

    const maze = new PolarMaze(rows, recursiveBacktracker, cellSize)
    const city = maze.toCity({ texture: 'terrain/snow.jpg' })
    this.addMesh(city)

    // the golem starts outside the outer ring, facing the city
    const { body, chase } = leadCharacter(this, golem, { x: cellSize * .5, z: -mazeSize - cellSize,
      ...worldQueries([city, hill]), input: { buttonDict: { attack: icons.unarmed, attack2: icons.unarmed } } })
    body.face({ x: 0, z: 0 })
    chase.view.chaseCamera.zoomIn()
  }
}
