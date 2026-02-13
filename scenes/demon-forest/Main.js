import Scena3D from '/core/Scena3D.js'
import { baseControls } from '/ui/Controls.js'
import { createTrees } from '/core3d/geometry/trees.js'
import { DemonPlayer } from '/core3d/actor/derived/fantasy/Demon.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'

export default class extends Scena3D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Space: 'jump' },
      toon: true,
    })
  }

  async init() {
    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)
    const trees = createTrees()
    this.addMesh(trees)

    const player = new DemonPlayer({ camera: this.camera, solids: trees })
    this.add(player)
  }
}
