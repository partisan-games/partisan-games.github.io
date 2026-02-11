import Scena3D from '/core/Scena3D.js'
import { baseControls } from '/ui/Controls.js'
import { createTrees } from '/core3d/geometry/trees.js'
import Avatar from '/core3d/actor/Avatar.js'
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
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'

    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)
    const trees = createTrees()
    this.addMesh(trees)

    const player = new Avatar({ camera: this.camera, solids: trees })
    this.add(player)
  }
}
