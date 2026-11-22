import canvas2d from '/core/io/canvas2d.js'
import DiveBomber from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import DiveBomberSprite from '/core/actor/aircraft/DiveBomberSprite.js'
import Bombardier from '/core/gameplay/controllers/Bombardier.js'

/**
 * A Ju 87 attack on the crossing: seconds before the first and between two, at least and at most; how high above the
 * near trenches the plane comes in, in metres; how much of the defenders' strength its bomb takes; how long a shot
 * down one falls before it is gone, in seconds; and how far down the screen the defenders lie, as a share of its height.
 */
export const airAttack = { first: 15, wait: { least: 20, most: 30 }, altitude: 13, damage: 15, fall: 3, defendersAt: .85 }

/** Nothing in the scene moves the camera; the plane's burst and bomb are drawn where they are. */
const still = { cameraX: 0, cameraY: 0 }

/**
 * Now and then a Ju 87 comes in from a side of the sky, dives on the defenders below the near trenches and drops its
 * bomb there, `onBomb(point)`; a click on it brings it down. `projection` draws the near row; the scene adds and removes
 * the plane, `{ body, view, controller }`.
 */
export default class AirAttack {
  constructor({ scene, projection, onBomb, random = Math.random }) {
    Object.assign(this, { scene, projection, random })
    this.plane = null
    this.wait = airAttack.first
    this.onBomb = onBomb
  }

  /** The defenders, where the dive aims and its bomb bursts: in front of the trenches, near the bottom of the screen. */
  get defenders() {
    return { ...this.projection.toWorld({ x: canvas2d.width / 2, y: canvas2d.height * airAttack.defendersAt }), alive: true }
  }

  launch() {
    const { projection, scene } = this
    const fromLeft = this.random() < .5
    const { x } = projection.toWorld({ x: fromLeft ? -100 : canvas2d.width + 100, y: 0 })
    const body = new DiveBomber({ x, y: airAttack.altitude, yaw: fromLeft ? 0 : Math.PI, canFire: () => scene.session.state === 'running',
      groundAt: () => this.defenders.y, onImpact: point => this.onBomb(point) })
    const view = new DiveBomberSprite(body, { projection, camera: still })
    const controller = new Bombardier(body, this.defenders, { sees: () => true })
    this.plane = { body, view, controller }
    scene.add(body, view)
    scene.controllers.push(controller)
  }

  /** Whether a click at screen point `aim` hits the plane, which it brings down. */
  shoot(aim) {
    const view = this.plane?.view
    if (!view || this.plane.body.dead || !view.visible) return false
    if (Math.abs(aim.x - view.x) > view.width / 2 || Math.abs(aim.y - view.y) > view.height / 2) return false
    this.plane.body.takeHit(this.plane.body.health.maximum)
    return true
  }

  /** A plane gone past the screen or fallen leaves; the next comes after a wait while the scene `allows` it. */
  update(dt, allows) {
    const { plane } = this
    if (plane) {
      const { x } = this.projection.point(plane.body)
      const gone = plane.body.alive && (plane.body.forward > 0 ? x > canvas2d.width + 200 : x < -200)
      if (gone || (plane.body.dead && plane.body.stateTime >= airAttack.fall)) this.clear()
      return
    }
    if (!allows) return
    this.wait -= dt
    if (this.wait > 0) return
    this.wait = airAttack.wait.least + this.random() * (airAttack.wait.most - airAttack.wait.least)
    this.launch()
  }

  clear() {
    const { plane, scene } = this
    if (!plane) return
    scene.remove(plane.body, plane.view)
    scene.controllers.splice(scene.controllers.indexOf(plane.controller), 1)
    this.plane = null
  }
}
