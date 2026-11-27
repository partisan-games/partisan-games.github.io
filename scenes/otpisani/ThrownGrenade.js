import { assets } from '/config.js'
import { grenadePicture as picture } from '/core/actor/projectiles/GrenadeSprite.js'

/**
 * How a thrown grenade flies: `duration` seconds, its arc rising `rise` of the way's length over the straight line,
 * tumbling `tumble` turns a second, drawn `near` times its picture's size as it leaves the hand.
 */
export const flight = { duration: .4, rise: .35, tumble: 2, near: 4 }

/**
 * A hand grenade the player throws from the bottom of the screen, `from`, to where he aimed, `to`, both points of the
 * world: it flies in an arc, tumbling and shrinking with the distance to its picture's own size, and calls
 * `onLand(to)` once it lands there.
 */
export default class ThrownGrenade {
  constructor({ from, to, onLand }) {
    Object.assign(this, { from, to, onLand })
    this.time = 0
    this.image = new Image()
    this.image.src = assets.images + picture.src
    this.layer = -2
  }

  get landed() {
    return this.time >= flight.duration
  }

  update(dt) {
    if (this.landed) return
    this.time = Math.min(flight.duration, this.time + dt)
    if (this.landed) this.onLand(this.to)
  }

  /** Where it is, `share` of the way: on the straight line from the hand, raised by the arc. */
  at(share) {
    const { from, to } = this
    const arc = flight.rise * Math.hypot(to.x - from.x, to.y - from.y) * 4 * share * (1 - share)
    return { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share - arc }
  }

  render(ctx) {
    if (this.landed || !this.image.naturalWidth) return
    const share = this.time / flight.duration
    const { x, y } = this.at(share)
    const size = flight.near + (1 - flight.near) * share
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(this.time * flight.tumble * Math.PI * 2)
    ctx.scale(size, size)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, picture.x, picture.y, picture.width, picture.height,
      -picture.width / 2, -picture.height / 2, picture.width, picture.height)
    ctx.restore()
  }
}
