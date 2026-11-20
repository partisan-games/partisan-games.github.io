import Scene3D from '/core/Scene3D.js'
import { keys } from '/core/io/keys.js'
import { Stars } from '/core3d/Particles.js'

export default class FlyingThroughSpaceScene extends Scene3D {
  constructor() {
    super({ controlKeys: { [keys.pause.label]: 'pause' } })
  }

  async init() {
    this.backgroundColor = 0x000000
    this.add(new Stars())
  }
}
