import canvas2d from '/core/io/canvas2d.js'
import Skirmisher from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'

/**
 * The partisan riflemen of the Fourth Army along the road: how many hold positions at a time, how far apart, in
 * metres, and how far behind the view's left edge one is, in pixels, before he takes a new position ahead.
 */
export const escort = { count: 4, apart: 26, behind: 60 }

/**
 * Partisan riflemen hold positions by the road the column takes: each kneels and fires while the enemy is in sight
 * and stands by otherwise. Their fire hits nothing the game counts; they set the scene of the advance on Trieste. One
 * the view has passed takes a new position ahead of the farthest. The scene adds them; `soldiers` are `{ body, view }`.
 */
export default class Escort {
  constructor({ scene, projection, enemyInSight, z }) {
    Object.assign(this, { scene, projection, enemyInSight })
    const first = (scene.cameraX + canvas2d.width * .6) / projection.pxPerMeter
    this.soldiers = Array.from({ length: escort.count }, (_, i) => {
      const body = new Skirmisher({ x: first + i * escort.apart, yaw: 0 })
      const view = new SkirmisherSprite(body, { projection, camera: scene })
      view.position.z = z
      return { body, view }
    })
    scene.add(...this.soldiers.flatMap(({ body, view }) => [body, view]))
  }

  update() {
    const { scene, projection } = this
    const wanted = this.enemyInSight() ? 'fire' : 'idle'
    for (const { body } of this.soldiers) {
      if (projection.point(body).x < scene.cameraX - escort.behind) {
        body.x = Math.max(...this.soldiers.map(other => other.body.x)) + escort.apart
        body.setState('idle')
      }
      if (body.state !== wanted && body.state !== 'kneel') body.setState(wanted)
    }
  }
}
