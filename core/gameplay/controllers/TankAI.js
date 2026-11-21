import Cooldown from '../Cooldown.js'

/**
 * Seconds between pushes, turns and shots; the share of turns that go back; the share of the tank's ground, behind
 * it, from which it always drives ahead; and the most throttle of a push.
 */
export const tankAI = { push: .07, turn: .3, fireWait: 1.5, turnBack: .4, backZone: .2, power: .5 }

/**
 * A tank that drives itself: it drives now ahead, now back, in pushes of random throttle, keeps to its ground, and
 * fires at the nearest living one of `targets` as often as it waits. Its waits go by the game `clock` and start with
 * the controller. The body has `x`, `y`, `forward`, `bounds`, `dead`, `drive(way, dt, power)`, `aimAt(point)` and
 * `shoot()`.
 */
export default class TankAI {
  constructor(body, { clock, targets, random = Math.random }) {
    this.body = body
    this.targets = targets
    this.random = random
    this.way = body.forward
    this.power = 0
    this.pushWait = new Cooldown({ seconds: tankAI.push, clock })
    this.turnWait = new Cooldown({ seconds: tankAI.turn, clock })
    this.fireWait = new Cooldown({ seconds: tankAI.fireWait, clock })
    ;[this.pushWait, this.turnWait, this.fireWait].forEach(wait => wait.start())
  }

  chooseWay() {
    const { body } = this
    if (this.turnWait.ready) {
      this.way = this.random() > tankAI.turnBack ? body.forward : -body.forward
      this.turnWait.start()
    }
    const { min, max } = body.bounds, ahead = body.forward
    const front = ahead > 0 ? max : min
    const back = ahead > 0 ? min : max
    if ((body.x - back) * ahead < (max - min) * tankAI.backZone) this.way = ahead
    if ((body.x - front) * ahead > 0) this.way = -ahead
  }

  nearestTarget() {
    const { body } = this
    const distance = target => Math.hypot(target.x - body.x, target.y - body.y)
    return this.targets.filter(target => target.alive)
      .reduce((nearest, target) => !nearest || distance(target) < distance(nearest) ? target : nearest, null)
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    this.chooseWay()
    if (this.pushWait.ready) {
      this.power = this.random() * tankAI.power
      this.pushWait.start()
    }
    body.drive(this.way, dt, this.power)
    const target = this.nearestTarget()
    if (!target) return
    body.aimAt(target)
    if (!this.fireWait.ready) return
    body.shoot()
    this.fireWait.start()
  }
}
