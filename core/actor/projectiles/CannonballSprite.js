import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'

/** How a cannonball looks and sounds: a black ball whistling in flight, and its bang and small fire when it bursts. */
export default class CannonballSprite extends GameObject2D {
  constructor(ball, projection) {
    super(null, { visible: false })
    this.ball = ball
    this.projection = projection
    this.flightSound = new Sound('shell-flight.mp3', { volume: .45, loop: true, profile: 'flight', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { volume: .9, profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.flightSound, this.explosionSound)
    this.smallFlame = new GameObject2D('plamen.gif', { scale: .4, visible: false })
    this.children.push(this.smallFlame)
    this.burstsSeen = ball.bursts
  }

  /** A high arc leaves the top of the screen and comes back, so it is never left out for being off screen. */
  get offScreen() {
    return false
  }

  update() {
    const { ball, projection } = this
    const { x, y } = projection.point(ball)
    this.setPosition(x, y)
    this.visible = ball.state === 'flight'
    this.flightSound.setPlaying(this.visible)
    if (ball.bursts > this.burstsSeen) {
      this.explosionSound.play()
      this.smallFlame.setPosition(x, y)
    }
    this.burstsSeen = ball.bursts
    this.smallFlame.visible = ball.state === 'burst'
  }

  render(ctx) {
    if (!this.visible) return
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.projection.length(this.ball.size.length / 2), 0, Math.PI * 2)
    ctx.fill()
  }
}
