import Scene2D from '/core/Scene2D.js'
import { drawSky } from '/core/io/canvas2d.js'
import Target from './Target.js'
import Dummy from './Dummy.js'
import Body from '/core/gameplay/bodies/Body.js'
import { sideProjection } from '/core/actor/projection.js'

/** The share of the view's height above the ground line, so the ground under the blocks is seen. */
const skyShare = .8
/** How large a block in metres is drawn, unless its story draws it as its game does. */
const defaultScale = 22
/** How far the view can be zoomed in and out. */
const zoomRange = { min: .25, max: 8 }

/**
 * An empty 2D world where one building block lives on its own: sky, ground, a camera and an unseen stand-in for the
 * player, for a block that flies or drives after one. Nothing drives the block: the stage gives it no keys.
 * A block in metres is drawn through `projection`, at `pxPerMeter`, and its stand-in is `dummy`, until every block
 * is in metres.
 */
export default class Stage2D extends Scene2D {
  constructor({ pxPerMeter = defaultScale } = {}) {
    super({ disableEvents: true, showControls: false })
    this.groundY = Math.round(this.height * skyShare)
    this.projection = sideProjection({ pxPerMeter, groundY: this.groundY })
    this.dummy = new Dummy({ x: this.width / 2 / pxPerMeter, y: 300 / pxPerMeter, size: { length: 9, height: 2.7, width: 9 } })
    /** What a block that follows the player follows, as high as a plane flies; it is not drawn. */
    this.target = new Target({ x: this.width / 2, y: this.groundY - 300 })
    // the target hears what the block does, as the player does in a game
    this.audioPlayer = () => this.target
    /** How many times larger than its game the view draws the blocks, around the middle of the ground line. */
    this.zoom = 1
  }

  /** Zooms the view in, or out with a `factor` below 1. */
  zoomBy(factor) {
    this.zoom = Math.min(zoomRange.max, Math.max(zoomRange.min, this.zoom * factor))
  }

  /** Keeps `block` in the middle of the view, or with none lets the view stand. */
  follow(block = null) {
    this.followed = block
  }

  handleInput() {}

  update(dt, t) {
    super.update(dt, t)
    if (!this.followed) return
    const x = this.followed instanceof Body ? this.projection.point(this.followed).x : this.followed.x
    this.cameraX = x - this.width / 2
  }

  clear() {
    const { ctx } = this.renderer
    const ground = this.groundY - this.cameraY
    drawSky(ground, 'blue', 'lightblue', -this.cameraY)
    ctx.fillStyle = '#5c6b3a'
    ctx.fillRect(0, ground, this.width, this.height - ground)
  }

  render() {
    this.renderer.cameraX = this.cameraX
    this.renderer.cameraY = this.cameraY
    const { ctx } = this.renderer, x = this.width / 2, y = this.groundY - this.cameraY
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(this.zoom, this.zoom)
    ctx.translate(-x, -y)
    super.render()
    ctx.restore()
  }

}
