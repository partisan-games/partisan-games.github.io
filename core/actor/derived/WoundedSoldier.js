import Player2D from '/core/actor/Player2D.js'

export default class WoundedSoldier extends Player2D {
  constructor(x, y) {
    super('armies/ranjeni-partizan.png', { x, y })
    this.tankControls = true
    this.thrust = 3
    this.turnRate = 0.01
  }

  checkBounds() {
    this.keepOnScreenVertically()
  }
}
