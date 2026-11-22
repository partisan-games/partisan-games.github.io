import { keys } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveDivision } from '/core3d/mazes/algorithms.js'
import { Fog, Object3D } from 'three'
import { dirLight, hemLight } from '/core3d/light.js'
import { createTexture } from '/core3d/helpers.js'
import { createDunes } from '/core3d/ground.js'
import { description as witch, models as witchModels } from '/core3d/actor/derived/fantasy/Witch.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'
import { buildRuins } from './masonry.js'

export default class RuinsScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      uiStyle: 'rpg',
      canvasBackground: 'linear-gradient(#69949e, #eed6b7 60%)',
      controlKeys: { ...thirdPersonControls, [keys.jump.label]: '', [keys.attack2.label]: 'secondary attack', [keys.special.label]: 'special' },
    })
  }

  async init() {
    await requestModels([...witchModels])
    this.scene.fog = new Fog(0xe0c4a5, 32, 147)
    hemLight({ scene: this.scene, skyColor: 0xffefd9, groundColor: 0xba9b8f, intensity: 1.3 })
    const focus = new Object3D()
    focus.position.z = -44
    this.addMesh(focus)
    const sun = dirLight({ scene: this.scene, pos: [-88, 58, -110], target: focus,
      color: 0xffdeb3, intensity: 2.3, area: 125, mapSize: 2048 })
    sun.shadow.normalBias = .035

    const maze = new Maze({ columns: 10, rows: 20, algorithm: recursiveDivision, cellSize: 10 })
    const dunes = await createDunes()
    dunes.geometry.computeVertexNormals()
    dunes.material.vertexColors = false
    dunes.material.userData.outlineParameters = { visible: false }
    dunes.material.map = createTexture({ file: 'terrain/sand.jpg', repeat: 65 })
    const { groundAt } = worldQueries(dunes)
    const { walls, masonry, gateX, gateZ } = buildRuins(maze, groundAt)
    this.addMesh(dunes, walls, masonry)

    const { body, chase } = leadCharacter(this, witch, {
      x: gateX - 1, z: gateZ - 23, ...worldQueries([dunes, walls, masonry]),
      view: { height: 2.1, distance: 3.3, lookAt: [0, 2.2, -2] },
      input: { buttonDict: { attack: icons.magic, attack2: icons.magic, special: icons.special } } })
    body.face({ x: gateX, z: gateZ })
    chase.view.chaseCamera.zoomIn()
  }
}
