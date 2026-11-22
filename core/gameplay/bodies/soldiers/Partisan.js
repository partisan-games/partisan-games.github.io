import Body from '../Body.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import geometry from '../../reinforcementGeometry.js'

/** Physical roles shared by the new partisan figures; controllers supply duties and targets. */
export const partisanKinds = {
  runner: { speed: 8, interval: 1.4, armed: true },
  lmg: { speed: 3, interval: .18, armed: true },
  rear: { speed: 2, interval: 1.4, armed: true },
  loader: { speed: 2, armed: false },
}
const stop = body => {
  body.vx = 0
}
const states = {
  idle: { enter: stop },
  move: { update: body => {
    body.vx = body.forward * body.moveSpeed
  } },
  attack: { update: body => body.shoot() },
  work: { enter: stop },
  dead: { enter: stop },
}

export default class Partisan extends Body {
  constructor({ role = 'runner', targets = [], groundAt = null, view = null, random = Math.random, ...options } = {}) {
    const kind = partisanKinds[role]
    const available = Object.fromEntries(Object.entries(states).filter(([name]) =>
      name !== (kind.armed ? 'work' : 'attack')))
    super({ size: { length: .7, height: 1.8, width: .55 }, ...options, states: available })
    Object.assign(this, { role, kind, groundAt, targets })
    this.moveSpeed = kind.speed
    if (groundAt) this.y = groundAt(this.x) + this.size.height / 2
    this.bullets = new ProjectilePool(() => new Bullet({ view, random, damage: { min: 3, max: 3 } }))
    this.sinceShot = Infinity
    this.aimPoint = this.ahead(10)
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }
  get shots() {
    return this.kind.armed ? { straight: { x: 10, y: 0 } } : {}
  }
  get muzzle() {
    const { ahead = 0, above = 0 } = geometry['partisan-' + this.role] ?? {}
    return this.ahead(ahead, above)
  }

  aimAt(point) {
    if (!this.kind.armed || this.forward * (point.x - this.x) <= 0) return false
    this.aimPoint = point
    return true
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return false
    return super.setState(name)
  }

  shoot() {
    if (this.dead || !this.kind.armed || this.sinceShot < this.kind.interval) return false
    const pitch = Math.atan2(this.aimPoint.y - this.muzzle.y, Math.abs(this.aimPoint.x - this.muzzle.x))
    this.bullets.fire(this.muzzle, this.yaw, pitch, 30)
    this.shotsFired++
    this.sinceShot = 0
    return true
  }

  update(dt) {
    this.sinceShot += dt
    super.update(dt)
    if (this.groundAt) this.y = this.groundAt(this.x) + this.size.height / 2
    this.bullets.update(dt, this.targets)
  }
}
