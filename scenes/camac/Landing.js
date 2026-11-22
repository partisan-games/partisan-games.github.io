import canvas2d, { ctx } from '/core/io/canvas2d.js'

/**
 * A fictional landing site within the historical operation, not a mapped wartime pier. It lies in the pixels of the
 * river; it steers the boat `player`, a body in metres, through `projection`, and walks its `passengers` ashore.
 * `startX` is where the boat set out and `distance` how far from there the pier lies, in pixels.
 */
export default class Landing {
  constructor({ coast, session, player, passengers, projection, viewLeft, startX, distance, random = Math.random }) {
    this.coast = coast
    this.session = session
    this.player = player
    this.projection = projection
    this.viewLeft = viewLeft
    this.x = startX + distance
    this.position = { z: .5 }
    this.startedAt = null
    this.progress = 0
    this.complete = false
    passengers.placeOf = (i, seat) => this.ashore(i, seat)
    this.strides = Array.from({ length: 4 }, () => random() * Math.PI * 2)
  }

  get shoreY() {
    return this.coast.edgeAt(this.x, -1)
  }
  get pierY() {
    return Math.min(canvas2d.height * .45, Math.max(115, this.shoreY + 85))
  }
  get active() {
    return this.startedAt !== null
  }

  /** Once the boat reaches the pier, the landing takes it, brings it alongside and lands its troops. */
  update() {
    if (this.session.state !== 'running' || this.complete || this.shoreY === null) return
    const boat = this.player
    if (boat.dead) return
    const at = this.projection.point(boat)
    const height = this.projection.length(boat.size.width)
    if (!this.active) {
      if (at.x < this.x - 85) return
      this.startedAt = this.session.clock.now
      this.approach = { x: at.x, y: at.y, angle: this.projection.angle(boat.yaw) }
      this.arrivalTime = Math.max(.8, Math.hypot(this.x - at.x, this.pierY + height / 2 + 8 - at.y) / 200)
      boat.vx = boat.vz = 0
    }
    const elapsed = this.session.clock.now - this.startedAt
    const arrival = Math.min(1, elapsed / this.arrivalTime)
    const eased = arrival * arrival * (3 - 2 * arrival)
    const place = this.projection.toWorld({
      x: this.approach.x + (this.x - this.approach.x) * eased,
      y: this.approach.y + (this.pierY + height / 2 + 8 - this.approach.y) * eased,
    })
    boat.x = place.x
    boat.z = place.z
    boat.vx = boat.vz = 0
    const turn = Math.atan2(Math.sin(-this.approach.angle), Math.cos(-this.approach.angle))
    boat.yaw = -(this.approach.angle + turn * eased)
    this.progress = Math.min(1, Math.max(0, (elapsed - this.arrivalTime) / 3.6))
    this.complete = this.progress === 1
  }

  render() {
    if (this.x + 110 < this.viewLeft() || this.x - 110 > this.viewLeft() + canvas2d.width || this.shoreY === null) return
    const shore = this.shoreY, end = this.pierY
    ctx.save()
    ctx.fillStyle = '#66513b'
    ctx.fillRect(this.x - 15, shore - 10, 30, end - shore + 10)
    ctx.fillRect(this.x - 100, end - 12, 200, 16)
    ctx.strokeStyle = '#ac9470'
    ctx.lineWidth = 2
    for (let y = shore; y < end - 12; y += 9) {
      ctx.beginPath()
      ctx.moveTo(this.x - 14, y)
      ctx.lineTo(this.x + 14, y)
      ctx.stroke()
    }
    ctx.fillStyle = '#302d27'
    for (const offset of [-90, -45, 45, 90]) ctx.fillRect(this.x + offset - 3, end - 15, 6, 22)
    ctx.restore()
  }

  /** Where passenger `i`, who sat at `seat`, stands as the landing goes on: walking off along the pier, facing the shore. */
  ashore(i, seat) {
    const progress = Math.min(1, Math.max(0, this.progress * 1.5 - i / 6))
    const spread = Math.max(0, (progress - .85) / .15)
    const stride = Math.sin(progress * Math.PI * 18 + this.strides[i]) * (progress > 0 && progress < 1 ? .6 : 0)
    const turn = Math.atan2(Math.sin(Math.PI / 4 - seat.angle), Math.cos(Math.PI / 4 - seat.angle))
    return {
      x: seat.x + (this.x - seat.x) * Math.min(1, progress * 3) + (i - 1.5) * 16 * spread + stride,
      y: seat.y + (this.shoreY - 13 - seat.y) * progress,
      angle: seat.angle + turn * Math.min(1, progress * 5),
    }
  }
}
