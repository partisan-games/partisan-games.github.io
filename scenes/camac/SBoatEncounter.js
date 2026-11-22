import canvas2d from '/core/io/canvas2d.js'
import Raider from '/core/gameplay/controllers/Raider.js'
import SBoat from '/core/gameplay/bodies/boats/SBoat.js'
import SBoatSprite from '/core/actor/boats/SBoatSprite.js'
import PatrolBoat, { patrolBoatKinds } from '/core/gameplay/bodies/boats/PatrolBoat.js'
import PatrolBoatSprite from '/core/actor/boats/PatrolBoatSprite.js'

/** Seconds before the first pass and between the end of a pass and the next; a stage sets its own `pace`. */
const timing = { first: 10, quiet: 28 }
/** The height of each lane, as a share of the view's, above and below the middle of the river. */
const lanes = { above: .3, below: .7 }

/**
 * One enemy vessel at a time comes from the right, following the stage's fleet in order, in a lane above the middle
 * or below it in turn, and raids the boat until it is sunk or left behind, with a quiet interval between passes. The scene adds and removes
 * the boat it makes; `boat` is the one in play, `{ body, view, raider }`, or null.
 */
export default class SBoatEncounter {
  constructor({ scene, target, pace = {}, fleet = ['sboat'] }) {
    this.scene = scene
    this.target = target
    this.pace = { ...timing, ...pace }
    this.boat = null
    this.nextAt = scene.session.clock.now + this.pace.first
    this.side = 1
    this.fleet = fleet
    this.pass = 0
  }

  /** Makes the next pass, entering from the right edge of the view. */
  launch(id = 'sboat') {
    const { scene } = this
    const { projection, session } = scene
    const lane = projection.toWorld({ x: 0, y: canvas2d.height * (this.side > 0 ? lanes.below : lanes.above) }).z
    const Vessel = id === 'sboat' ? SBoat : PatrolBoat
    const body = new Vessel({ kind: patrolBoatKinds[id], lane, clock: session.clock, targets: [this.target], canFire: () => scene.running && scene.onScreen(body),
      view: scene.screenView })
    body.x = projection.toWorld({ x: scene.cameraX + canvas2d.width, y: 0 }).x + body.size.length / 2 + .8
    body.z = lane
    const view = id === 'sboat' ? new SBoatSprite(body, { projection, camera: scene })
      : new PatrolBoatSprite(body, { id, projection, camera: scene })
    const raider = new Raider(body, this.target, { viewWidth: () => canvas2d.width / projection.pxPerMeter,
      sees: target => scene.onScreen(target) })
    this.boat = { body, view, raider, id }
    this.side *= -1
    scene.enlist(this.boat, [raider])
  }

  /** A pass ends when its wreck has sunk, or when the boat has left it behind the view. */
  update({ allowSpawn = true } = {}) {
    const { scene } = this
    if (!scene.running) return
    const { now } = scene.session.clock
    const { boat } = this
    if (boat) {
      const { body } = boat
      const left = scene.projection.toWorld({ x: scene.cameraX, y: 0 }).x
      if (body.sunk || (body.alive && body.x + body.size.length / 2 < left)) {
        scene.discharge(boat)
        this.boat = null
        this.nextAt = now + this.pace.quiet * (body instanceof PatrolBoat ? .15 : 1)
      }
    } else if (allowSpawn && now >= this.nextAt) this.launch(this.fleet[this.pass++ % this.fleet.length])
  }
}
