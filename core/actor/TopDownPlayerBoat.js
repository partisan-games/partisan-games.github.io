import TopDownPlayerVehicle from '/core/actor/derived/TopDownPlayerVehicle.js'
import canvas2d from '/core/io/canvas2d.js'

const JACINA_STRUJE = 6

export default class TopDownPlayerBoat extends TopDownPlayerVehicle {
  constructor(src = 'armies/camac.png') {
    super(src, { scale: .5 })
    this.thrust = 50
    this.frictionFactor = 0.15
  }

  moveDown() {}

  checkBounds() {
    const ofset = 75
    if (this.y < 0 + ofset || this.y > canvas2d.height - ofset) {
      this.turn(2 * Math.PI - this.angle)
      this.addForce(5)
    }
    this.keepOnScreenHorizontally()
  }

  applyCurrent() {
    if (this.x > this.width) this.addForce(JACINA_STRUJE, Math.PI)
  }

  update(dt) {
    super.update(dt)
    this.applyCurrent()
  }
}
