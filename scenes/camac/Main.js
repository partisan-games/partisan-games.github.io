import Scena2D from '/core/Scena2D.js'
import platno from '/core/io/platno.js'
import Boat from './Boat.js'
import Obala from './Obala.js'

export default class extends Scena2D {
  init() {
    this.cameraX = 0
    this.player = new Boat(() => this.cameraX)
    this.player.postavi(platno.width / 3, platno.height / 2)
    this.obala = new Obala(() => this.cameraX)
    this.add(this.obala, this.player)
    this.bojaPozadine = '#000066'
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    super.update(dt, t)
    this.cameraX = this.player.x - platno.width / 3
  }

  render() {
    const { kameraX, kameraY } = this.renderer
    this.renderer.kameraX = this.cameraX
    this.renderer.kameraY = 0
    try {
      super.render()
    } finally {
      // The renderer is shared with other scenes; camera ownership remains local.
      this.renderer.kameraX = kameraX
      this.renderer.kameraY = kameraY
    }
  }
}
