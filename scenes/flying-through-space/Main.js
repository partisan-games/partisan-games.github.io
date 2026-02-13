import Scena3D from '/core/Scena3D.js'
import { Stars } from '/core3d/Particles.js'

export default class extends Scena3D {
  async init() {
    this.bojaPozadine = 0x000000
    this.add(new Stars())
  }
}
