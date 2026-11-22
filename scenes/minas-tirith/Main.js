import { keys } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import PolarMaze from '/core3d/mazes/PolarMaze.js'
import { recursiveBacktracker } from '/core3d/mazes/algorithms.js'
import { Fog, Object3D } from 'three'
import { dirLight, hemLight } from '/core3d/light.js'
import { createTexture } from '/core3d/helpers.js'
import { approachPath, buildCitadel } from './citadel.js'
import { createHill } from '/core3d/ground.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { description as demon, models as demonModels } from '/core3d/actor/derived/fantasy/Demon.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import wallBlocker from '/core3d/actor/characters/wallBlocker.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'

const rows = 20
const cellSize = 10
const mazeSize = rows * cellSize

export default class MinasTirithScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...thirdPersonControls, [keys.special.label]: 'special' },
      canvasBackground: 'linear-gradient(#20568e, #aecfed)',
    })
  }

  async init() {
    await requestModels([...demonModels])
    const hill = createHill(mazeSize * 2.05, 164)
    hill.material.map = createTexture({ file: 'terrain/grass.jpg' })
    hill.material.map.repeat.set(230, 62)
    hill.material.color.setHex(0xacc882)
    hill.material.shininess = 0
    hill.receiveShadow = true
    this.addMesh(hill)

    this.scene.fog = new Fog(0xb6c8dd, 120, 520)
    hemLight({ scene: this.scene, skyColor: 0xe2ebff, groundColor: 0x909575, intensity: 1.65 })
    const focus = new Object3D()
    focus.position.set(0, 10, -mazeSize)
    this.addMesh(focus)
    const sun = dirLight({ scene: this.scene, target: focus, pos: [-70, 85, -245], area: 72,
      color: 0xffdfaa, intensity: 2.5, mapSize: 2048 })
    sun.shadow.normalBias = .045

    const maze = new PolarMaze(rows, recursiveBacktracker, cellSize)
    const { city, gateX } = buildCitadel(maze)
    this.addMesh(city, approachPath(gateX, mazeSize, worldQueries(hill).groundAt))

    const { groundAt, obstacleAt } = worldQueries([city, hill])
    // the demon starts outside the outer ring, facing the city
    const { body } = leadCharacter(this, demon, { x: gateX, z: -mazeSize - 2.6 * cellSize,
      jumping: 'fly', lift: 125, maxLift: .36, // A full jump clears twice the demon's height.
      groundAt, obstacleAt, resolveWallStep: wallBlocker(city, { widthScale: .97 }),
      view: { height: 2.5, distance: 4.2, lookAt: [0, 2.7, -2] },
      input: { buttonDict: { jump: '', attack: icons.unarmed, special: icons.magic } } })
    body.face({ x: gateX, z: -mazeSize })
  }
}
