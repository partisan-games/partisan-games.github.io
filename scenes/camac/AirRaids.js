import canvas2d from '/core/io/canvas2d.js'
import AttackPlane, { attackPlaneKinds } from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import AttackPlaneSprite, { attackPlaneImages } from '/core/actor/aircraft/AttackPlaneSprite.js'
import PathFlight from '/core/gameplay/controllers/PathFlight.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'

/**
 * A German fighter strafing the boat once a stage, near its end: how far outside the view it enters and leaves, in
 * pixels; how much a bullet takes off the boat; and how long it falls once shot down, in seconds.
 */
export const raid = { margin: 300, damage: 3, fall: 2 }
/** A fighter of the sea war: three rounds of the boat's gun bring it down, and it fires fast while it passes. */
const fighter = { ...attackPlaneKinds.fighter, hits: 30, fire: { interval: .35, spread: [0] } }

/**
 * Once a stage, near its end, a fighter comes in from ahead of the boat, low over the sea, flies over it firing and
 * leaves behind it. The scene adds and removes the plane it makes; `planes` are those in play, `{ body, view }`.
 */
export default class AirRaids {
  constructor({ scene, target, random = Math.random }) {
    Object.assign(this, { scene, target, random })
    this.planes = []
    this.flown = false
  }

  /** Whether `body` is one of the planes in play. */
  flies(body) {
    return this.planes.some(plane => plane.body === body)
  }

  /** The raid, towards where the boat is now, from beyond the right edge of the view, above or below it. */
  launch() {
    const { scene, target, random } = this
    const { projection, session } = scene
    const boat = projection.point(target)
    const from = { x: scene.cameraX + canvas2d.width + raid.margin, y: random() < .5 ? -raid.margin / 2 : canvas2d.height + raid.margin / 2 }
    const length = Math.hypot(boat.x - from.x, boat.y - from.y)
    const way = { x: (boat.x - from.x) / length, y: (boat.y - from.y) / length }
    const speed = projection.length(fighter.speed)
    const body = new AttackPlane({ kind: fighter, clock: session.clock, targets: [target], damage: raid.damage, random,
      canFire: () => scene.running && scene.onScreen(body), view: scene.screenView })
    const position = t => projection.toWorld({ x: from.x + way.x * speed * t, y: from.y + way.y * speed * t })
    const view = new AttackPlaneSprite(body, { src: attackPlaneImages.fighter[Math.floor(random() * attackPlaneImages.fighter.length)],
      projection, camera: scene })
    // it flies over the boats and the men aboard
    view.position.z = -5
    const plane = { body, view }
    this.planes.push(plane)
    this.flown = true
    scene.enlist(plane, [new PathFlight(body, { position }), new Gunner(body, target)])
  }

  /** A plane past the view behind the boat, or fallen, leaves play; `nearEnd` stages send their one raid. */
  update({ nearEnd = false } = {}) {
    const { scene } = this
    if (!scene.running) return
    for (const plane of [...this.planes]) {
      const { body } = plane
      const passed = scene.projection.point(body).x < scene.cameraX - raid.margin
      if ((body.dead && body.stateTime >= raid.fall) || (body.alive && passed)) {
        scene.discharge(plane)
        this.planes.splice(this.planes.indexOf(plane), 1)
      }
    }
    if (nearEnd && !this.flown) this.launch()
  }
}
