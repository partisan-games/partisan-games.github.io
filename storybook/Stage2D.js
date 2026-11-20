import Scene2D from '/core/Scene2D.js'
import { drawSky } from '/core/io/canvas2d.js'
import Target from './Target.js'
import { isTouchScreen } from '/config.js'
import { keys } from '/core/io/keys.js'

/** The share of the view's height above the ground line, so the ground under the blocks is seen. */
const skyShare = .8

/**
 * An empty 2D world where one building block lives on its own: sky, ground, a camera and an unseen stand-in for the
 * player, for a block that flies or drives after one.
 */
export default class Stage2D extends Scene2D {
  /** `controlKeys` of a block the keys drive are shown as in its game, without pause, which the stage does not have. */
  constructor({ controlKeys } = {}) {
    super({
      disableEvents: true,
      showControls: Boolean(controlKeys) && !isTouchScreen,
      controlKeys: { ...controlKeys, [keys.pause.label]: '' },
    })
    this.groundY = Math.round(this.height * skyShare)
    /** What a block that follows the player follows, as high as a plane flies; it is not drawn. */
    this.target = new Target({ x: this.width / 2, y: this.groundY - 300 })
    // the target hears what the block does, as the player does in a game
    this.audioPlayer = () => this.target
  }

  /** Keeps `block` in the middle of the view, or with none lets the view stand. */
  follow(block = null) {
    this.followed = block
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.followed) this.cameraX = this.followed.x - this.width / 2
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
    super.render()
  }

}
