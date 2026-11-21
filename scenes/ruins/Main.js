import { keys } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { recursiveDivision } from '/core3d/mazes/algorithms.js'
import { hemLight } from '/core3d/light.js'
import { createDunes } from '/core3d/ground.js'
import { description as witch, models as witchModels } from '/core3d/actor/derived/fantasy/Witch.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'

export default class RuinsScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      uiStyle: 'rpg',
      controlKeys: { ...thirdPersonControls, [keys.jump.label]: '', [keys.attack2.label]: 'secondary attack', [keys.special.label]: 'special' },
    })
  }

  async init() {
    await requestModels([...witchModels])
    hemLight({ scene: this.scene })
    const maze = new Maze({ columns: 10, rows: 20, algorithm: recursiveDivision, cellSize: 10 })
    const ruins = maze.toMesh()
    this.addMesh(ruins)

    const dunes = await createDunes()
    this.addMesh(dunes)

    const { chase } = leadCharacter(this, witch, { ...worldQueries([dunes, ruins]),
      input: { buttonDict: { attack: icons.magic, attack2: icons.magic, special: icons.special } } })
    chase.view.chaseCamera.zoomIn()
  }
}
