import GameObject2D from '/core/actor/GameObject2D.js'

/** How a flying round looks, drawn while it flies; `src` and `scale` are its picture. */
export default class BulletSprite extends GameObject2D {
  constructor(body, projection, { src = 'items/granata.gif', scale = .5 } = {}) {
    super(src, { scale, visible: false })
    this.body = body
    this.projection = projection
  }

  /** It flies past the edge of the view until it falls out of play, so it is never left out for being off screen. */
  get offScreen() {
    return false
  }

  update() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    this.angle = projection.angle(body.yaw, body.pitch)
    this.visible = body.state === 'flight'
  }
}
