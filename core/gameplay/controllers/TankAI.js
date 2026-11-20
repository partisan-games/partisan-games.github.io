import Cooldown from '../Cooldown.js'

/**
 * Seconds between pushes, turns and shots; the share of turns that go back; and the share of the tank's ground,
 * behind it, from which it always drives ahead.
 */
export const tankAI = { push: .07, turn: .3, fireWait: 1.5, turnBack: .4, backZone: .2 }

/**
 * A tank that drives itself: it pushes now ahead, now back, keeps to its ground, and fires at the nearest living one
 * of its `targets` as often as it waits. Its waits go by the game `clock` and start with the controller. The body has
 * `minX`, `maxX`, `forward`, `angle`, `ugaoUnazad`, `thrust`, `targets`, `nisani(point)`, `shoot()` and `addForce`.
 */
export default class TankAI {
  constructor(body, { clock }) {
    this.body = body
    this.way = body.angle
    this.pushWait = new Cooldown({ seconds: tankAI.push, clock })
    this.turnWait = new Cooldown({ seconds: tankAI.turn, clock })
    this.fireWait = new Cooldown({ seconds: tankAI.fireWait, clock })
    ;[this.pushWait, this.turnWait, this.fireWait].forEach(wait => wait.start())
  }

  chooseWay() {
    const { body } = this
    if (this.turnWait.ready) {
      this.way = Math.random() > tankAI.turnBack ? body.angle : body.ugaoUnazad
      this.turnWait.start()
    }
    const ahead = body.forward
    const front = ahead > 0 ? body.maxX : body.minX
    const back = ahead > 0 ? body.minX : body.maxX
    if ((body.x - back) * ahead < (body.maxX - body.minX) * tankAI.backZone) this.way = body.angle
    if ((body.x - front) * ahead > 0) this.way = body.ugaoUnazad
  }

  push() {
    if (!this.pushWait.ready) return
    this.body.addForce(Math.random() * this.body.thrust, this.way)
    this.pushWait.start()
  }

  nearestTarget() {
    const { body } = this
    const living = body.targets.filter(target => target.alive)
    return living.reduce((nearest, target) => body.distanceTo(target) < body.distanceTo(nearest) ? target : nearest, living[0])
  }

  update() {
    const { body } = this
    if (body.dead) return
    this.chooseWay()
    this.push()
    const target = this.nearestTarget()
    if (!target || target.dead) return
    body.nisani(target)
    if (!this.fireWait.ready) return
    body.shoot()
    this.fireWait.start()
  }
}
