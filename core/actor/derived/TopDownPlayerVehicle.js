import Player2D from '/core/actor/Player2D.js'

export default class TopDownPlayerVehicle extends Player2D {

  constructor(src, param = {}) {
    super(src, param)
    this.thrust = 125
    this.frictionFactor = 0.3
    this.tankControls = true
  }

  checkBounds() {
    this.bounce()
  }
}
