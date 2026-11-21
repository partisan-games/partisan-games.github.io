import canvas2d from '/core/io/canvas2d.js'
import Marksman from '/core/gameplay/controllers/Marksman.js'
import ShoreMachineGun, { nest } from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'
import ShoreMachineGunSprite from '/core/actor/artillery/ShoreMachineGunSprite.js'

/**
 * A machine-gun nest on each bank, placed where the terrain lets it stand, never where the camera happens to be: as
 * one falls far behind the view, a new one is dug in ahead of the farthest. The scene adds and removes the nests it
 * makes; `positions` are those in play, `{ body, view, marksman }`.
 */
export default class ShoreDefenses {
  constructor({ coast, scene, target }) {
    this.coast = coast
    this.scene = scene
    this.target = target
    this.spacing = Math.max(1800, canvas2d.width * 1.9)
    this.positions = []
    let nextX = canvas2d.width * 1.5
    for (const side of [-1, 1]) {
      const post = this.place(side, nextX)
      if (post) nextX = this.scene.projection.point(post.body).x + this.spacing
    }
  }

  /** The nest's footprint on the bank, in pixels. */
  get footprint() {
    const { projection } = this.scene
    return { width: projection.length(nest.size.length), height: projection.length(nest.size.width) }
  }

  /** A nest on `side` at the first place from `fromX` pixels where its whole footprint stands on the bank. */
  place(side, fromX) {
    const { coast, scene, footprint } = this
    for (let i = 0; i < 64; i++) {
      const x = fromX + i * coast.noiseResolution
      const left = x - footprint.width / 2, right = x + footprint.width / 2
      const edges = [coast.edgeAt(left, side), coast.edgeAt(right, side)]
      for (let sample = Math.ceil(left / coast.noiseResolution) * coast.noiseResolution;
        sample < right; sample += coast.noiseResolution) edges.push(coast.edgeAt(sample, side))
      const boundary = side < 0 ? Math.min(...edges) : Math.max(...edges)
      const y = boundary + side * (footprint.height / 2 + 2)
      if (y - footprint.height / 2 < 1 || y + footprint.height / 2 > canvas2d.height - 1) continue
      return this.deploy(side, scene.projection.toWorld({ x, y }))
    }
    return null
  }

  deploy(side, { x, z }) {
    const { scene } = this
    const body = new ShoreMachineGun({ side, x, z, clock: scene.session.clock, targets: [this.target], view: scene.screenView })
    body.canFire = () => scene.running && scene.onScreen(body)
    const view = new ShoreMachineGunSprite(body, { projection: scene.projection, camera: scene })
    const marksman = new Marksman(body, this.target, { sees: target => scene.onScreen(target) })
    const post = { body, view, marksman }
    this.positions.push(post)
    scene.enlist(post, [marksman])
    return post
  }

  /** A nest half a view behind the view's left is gone; a new one is dug in on its bank, ahead of the farthest. */
  update() {
    const { scene } = this
    if (!scene.running) return
    for (const post of [...this.positions]) {
      const { x } = scene.projection.point(post.body)
      if (x + this.footprint.width / 2 >= scene.cameraX - canvas2d.width * .5) continue
      this.positions.splice(this.positions.indexOf(post), 1)
      scene.discharge(post)
      const lastX = Math.max(scene.cameraX + canvas2d.width, ...this.positions.map(other => scene.projection.point(other.body).x))
      this.place(post.body.side, lastX + this.spacing)
    }
  }
}
