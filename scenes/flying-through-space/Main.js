import Scene3D from '/core/Scene3D.js'
import { Stars } from '/core3d/Particles.js'

export default class FlyingThroughSpaceScene extends Scene3D {
  constructor() {
    // it has no keys to list but Esc, which every game pauses with
    super({ showControls: false })
  }

  async init() {
    this.backgroundColor = 0x000000
    this.add(new Stars())
  }
}
