import Body from '../Body.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/** A patrol's pace while it searches, in metres a second, measured at 40 px a metre, where a man is about 1.8 m. */
export const patrol = { speed: 2.25, shotInterval: .14, volleyTime: .6 }

const stand = body => {
  body.vx = body.vz = 0
}

/** The patrol rests, marches, fires once from each rifle, or lies fallen. */
const states = {
  idle: { enter: stand },
  move: {
    update: body => {
      body.vx = Math.cos(body.yaw) * patrol.speed
      body.vz = -Math.sin(body.yaw) * patrol.speed
    },
  },
  attack: {
    enter: body => {
      stand(body)
      body.volleyShots = 0
      body.fireNext()
    },
    update: body => {
      while (body.volleyShots < 3 && body.stateTime >= body.volleyShots * patrol.shotInterval) body.fireNext()
      if (body.stateTime >= patrol.volleyTime) body.setState('idle')
    },
  },
  dead: { enter: stand },
}

/** A patrol seen from above, heading along `yaw`. Where it turns, and when, is up to the world. */
export default class Patrol extends Body {
  constructor({ targets = [], random = Math.random, initial = 'idle', ...options } = {}) {
    super({ size: { length: 1.775, height: 1.8, width: 2 }, ...options, states })
    this.targets = targets
    this.bullets = new ProjectilePool(() => new Bullet({ random }))
    this.volleyShots = 0
    this.setState(initial)
  }

  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  /** Heads along `yaw`. */
  head(yaw) {
    if (this.alive) this.yaw = yaw
  }

  /** The three drawn tips point northwest in the reference formation at yaw zero. */
  fireNext() {
    const [dx, dz] = [[-.875, -.99], [.225, -.69], [-.2, .165]][this.volleyShots++]
    const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw)
    this.lastMuzzle = { x: this.x + dx * cos + dz * sin, y: this.y, z: this.z - dx * sin + dz * cos }
    this.shotYaw = this.yaw + Math.PI * .75
    this.bullets.fire(this.lastMuzzle, this.shotYaw, 0, 22)
    this.shotsFired++
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return
    super.setState(name)
  }

  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
