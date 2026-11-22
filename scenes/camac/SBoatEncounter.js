import canvas2d from '/core/io/canvas2d.js'
import Raider from '/core/gameplay/controllers/Raider.js'
import SBoat from '/core/gameplay/bodies/boats/SBoat.js'
import SBoatSprite from '/core/actor/boats/SBoatSprite.js'

/** Seconds before the first pass, between the end of a pass and the next, and the longest a pass lasts; a stage sets its own `pace`. */
const timing = { first: 10, quiet: 28, longest: 18 }
/** The height of each lane, as a share of the view's, above and below the middle of the river. */
const lanes = { above: .3, below: .7 }

/**
 * A sparse encounter on the river: one S-boat at a time comes up the river from the right, in a lane above the middle
 * or below it in turn, raids the boat and withdraws, with a quiet interval between passes. The scene adds and removes
 * the boat it makes; `boat` is the one in play, `{ body, view, raider }`, or null.
 */
export default class SBoatEncounter {
  constructor({ scene, target, pace = {} }) {
    this.scene = scene
    this.target = target
    this.pace = { ...timing, ...pace }
    this.boat = null
    this.nextAt = scene.session.clock.now + this.pace.first
    this.side = 1
  }

  /** Makes the next pass, entering from the right edge of the view. */
  launch() {
    const { scene } = this
    const { projection, session } = scene
    const lane = projection.toWorld({ x: 0, y: canvas2d.height * (this.side > 0 ? lanes.below : lanes.above) }).z
    const body = new SBoat({ lane, clock: session.clock, targets: [this.target], canFire: () => scene.running && scene.onScreen(body),
      view: scene.screenView })
    body.x = projection.toWorld({ x: scene.cameraX + canvas2d.width, y: 0 }).x + body.size.length / 2 + .8
    body.z = lane
    body.born = session.clock.now
    const view = new SBoatSprite(body, { projection, camera: scene })
    const raider = new Raider(body, this.target, { clock: session.clock, viewWidth: () => canvas2d.width / projection.pxPerMeter,
      sees: target => scene.onScreen(target) })
    this.boat = { body, view, raider }
    this.side *= -1
    scene.enlist(this.boat, [raider])
  }

  /** A pass ends when its wreck has sunk, or when it has gone past the view or lasted its longest. */
  update({ allowSpawn = true } = {}) {
    const { scene } = this
    if (!scene.running) return
    const { now } = scene.session.clock
    const { boat } = this
    if (boat) {
      const { body } = boat
      const left = scene.projection.toWorld({ x: scene.cameraX, y: 0 }).x
      const right = left + canvas2d.width / scene.projection.pxPerMeter
      const half = body.size.length / 2
      const outside = body.x + half < left || (body.withdrawing && body.x - half > right)
      if (body.sunk || (body.alive && (outside || now - body.born >= this.pace.longest))) {
        scene.discharge(boat)
        this.boat = null
        this.nextAt = now + this.pace.quiet
      }
    } else if (allowSpawn && now >= this.nextAt) this.launch()
  }
}
