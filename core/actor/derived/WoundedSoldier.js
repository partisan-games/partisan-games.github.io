import Player2D from '/core/actor/Player2D.js'
import LocomotionSprite from '/core/actor/LocomotionSprite.js'
import art from '/core/actor/ranjenikArt.js'

export default class WoundedSoldier extends Player2D {
  constructor(x, y) {
    const sprite = art.wounded
    super(sprite.src, { x, y, width: sprite.frame.width, height: sprite.frame.height })
    this.bodySprite = new LocomotionSprite(sprite)
    this.tankControls = true
    this.thrust = 3
    this.turnRate = 0.01
  }

  checkBounds() {
    this.keepOnScreenVertically()
  }

  update(dt) {
    const x = this.x, y = this.y
    super.update(dt)
    this.bodySprite.update(dt, this.alive && Math.hypot(this.x-x, this.y-y) > .001)
  }

  render() {
    this.bodySprite.render(this)
  }
}
