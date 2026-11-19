import Scene3D from '/core/Scene3D.js'
import { baseControls } from '/ui/Controls.js'
import { createTrees } from '/core3d/geometry/trees.js'
import { DemonPlayer, models as demonModels } from '/core3d/actor/derived/fantasy/Demon.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { requestModels } from '/core3d/assets/models.js'

export default class DemonForestScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Space: 'jump' },
      toon: true,
    })
  }

  async init() {
    await requestModels([...demonModels])
    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)
    const trees = createTrees()
    this.addMesh(trees)

    const player = new DemonPlayer({ camera: this.camera, solids: trees })
    this.audioPlayer = () => player
    this.add(player)
  }
}
