import WorldPart from '/core/actor/WorldPart.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'

/** A burst is drawn this far above where it hits the ground, in pixels, so the fire stands on it. */
const burstLift = 64

/** How a bomb body looks and sounds: the bomb falling nose first along its path, and its burst and bang. */
export default class BombSprite extends WorldPart {
  constructor(body, { projection, camera }) {
    super('items/bomba.png', { camera, scale: .5, visible: false })
    this.body = body
    this.projection = projection
    this.burst = new Explosion(camera)
    this.children.push(this.burst)
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.explosionSound)
    this.burstsSeen = body.bursts
  }

  update() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    // the picture shows the bomb nose down
    this.angle = projection.angle(body.yaw, body.pitch) - Math.PI / 2
    this.visible = body.state === 'flight'
    if (body.bursts > this.burstsSeen) {
      this.burst.start(x, y - burstLift)
      this.explosionSound.play()
    }
    this.burstsSeen = body.bursts
  }
}
