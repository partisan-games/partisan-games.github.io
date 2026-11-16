import Scene3D from '/core/Scene3D.js'
import { Stars } from '/core3d/Particles.js'

export default class FlyingThroughSpaceScene extends Scene3D {
  async init() {
    this.backgroundColor = 0x000000
    this.add(new Stars())
  }
}
