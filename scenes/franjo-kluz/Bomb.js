import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'
import { outsideView } from './view.js'

/**
 * Fall acceleration in pixels per second squared, chosen for play: dropped 300 px above the ground at takeoff speed,
 * a bomb falls about a second and lands some 350 px ahead of where it left the plane.
 */
export const bombGravity = 500

/**
 * An aerial bomb in world coordinates. It leaves the plane with the plane's velocity, falls, turns its nose along its
 * path and explodes when it reaches the ground; `onImpact(bomb)` deals the damage.
 */
export default class Bomb extends GameObject2D {
  constructor({ camera, groundAt, onImpact }) {
    super('items/bomba.png', { scale: .5, visible: false })
    this.camera = camera
    this.groundAt = groundAt
    this.onImpact = onImpact
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.explosionSound)
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  release({ x, y }, { dx, dy }) {
    this.setPosition(x, y)
    this.dx = dx
    this.dy = dy
    this.show()
  }

  /** A bomb below the view still falls on to the ground. */
  update(dt) {
    if (!this.visible) return
    this.dy += bombGravity * dt
    super.update(dt)
    // the picture shows the bomb nose down
    this.angle = Math.atan2(this.dy, this.dx) - Math.PI / 2
  }

  checkBounds() {
    const ground = this.groundAt(this.x)
    if (this.y < ground) return
    this.y = ground
    this.hide()
    this.explosionSound.play()
    this.onImpact(this)
  }
}
