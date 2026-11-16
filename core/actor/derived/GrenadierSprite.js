import Sprite from '../Sprite.js'

const vremeZaustavljanja = .15

export default class GrenadierSprite extends Sprite {
  constructor() {
    super('sprites/vojnici/bombas-idle.png', {
      names: ['idle', 'kretanje'], frameCount: [2, 8], defaultAnimation: 'idle',
      animationTime: .6, width: 66, height: 72,
    })
    this.animate = true
    this.movement = false
    this.walkSpeed = 0
    this.stopsLeft = 0
  }

  update(dt) {
    if (!this.animate) this.stopsLeft = 0
    else if (this.movement) this.stopsLeft = vremeZaustavljanja
    else this.stopsLeft = Math.max(0, this.stopsLeft - dt)
    const walking = this.animate && (this.movement || this.stopsLeft > 0)
    this.setAnimation(walking ? 'kretanje' : 'idle')
    this.animationTime = walking ? .8 : .6
    const slowdown = this.movement ? 1 : this.stopsLeft / vremeZaustavljanja
    // At full speed (~192px/s), play three steps per second with continuous phase.
    const animationDt = walking ? dt * this.walkSpeed / 160 * slowdown : dt
    if (this.animate) super.update(animationDt)
    else this.reset()
  }

  render() {
    if (this.shown) super.render()
  }
}
