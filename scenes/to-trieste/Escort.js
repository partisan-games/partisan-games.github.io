import canvas2d from '/core/io/canvas2d.js'
import Partisan from '/core/gameplay/bodies/soldiers/Partisan.js'
import PartisanSprite from '/core/actor/soldiers/PartisanSprite.js'

/**
 * The partisan riflemen of the Fourth Army along the road: how many hold positions at a time, how far apart, in
 * metres, and how far behind the view's left edge one is, in pixels, before he takes a new position ahead.
 */
export const escort = { count: 4, apart: 26, behind: 60 }

/**
 * Three riflemen run with the tank while a machine gunner holds roadside positions. Their supporting fire
 * preserves the existing outcome rules. A passed gunner takes a position ahead; the scene owns their bodies and views.
 */
export default class Escort {
  constructor({ scene, projection, enemyInSight, z }) {
    Object.assign(this, { scene, projection, enemyInSight })
    const first = (scene.cameraX + canvas2d.width * .6) / projection.pxPerMeter
    this.soldiers = Array.from({ length: escort.count }, (_, i) => {
      const body = new Partisan({ role: i === 3 ? 'lmg' : 'runner',
        x: i === 3 ? first : scene.player.x - 3 - i * 2, y: .9, yaw: 0 })
      const view = new PartisanSprite(body, { projection, camera: scene })
      view.position.z = z
      return { body, view }
    })
    scene.add(...this.soldiers.flatMap(({ body, view }) => [body, view]))
  }

  update(dt = 0) {
    const { scene, projection } = this
    const fighting = this.enemyInSight()
    for (const [i, { body }] of this.soldiers.entries()) {
      if (body.dead) continue
      if (body.role === 'runner') {
        const distance = scene.player.x - 3 - i * 2 - body.x
        body.yaw = distance < 0 ? Math.PI : 0
        body.moveSpeed = dt > 0 ? Math.min(body.kind.speed, Math.abs(distance) / dt) : 0
        body.setState(Math.abs(distance) > .1 ? 'move' : 'idle')
        body.vx = body.forward * body.moveSpeed
        if (fighting && body.forward > 0) {
          body.aimAt(body.ahead(15))
          body.setState('attack')
        }
        continue
      }
      if (projection.point(body).x < scene.cameraX - escort.behind) {
        body.x = Math.max(...this.soldiers.map(other => other.body.x)) + escort.apart
        body.setState('idle')
      }
      body.aimAt(body.ahead(15))
      body.setState(fighting ? 'attack' : 'idle')
    }
  }
}
