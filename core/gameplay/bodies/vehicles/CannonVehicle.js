import Vehicle, { vehicleStates } from './Vehicle.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'
import { tank } from './Tank.js'

const states = {
  idle: vehicleStates.idle,
  move: vehicleStates.move,
  attack: {
    enter: body => {
      body.vx = 0
      body.shells.fire(body.muzzle, body.yaw, 0, tank.shellSpeed)
      body.shotsFired++
    },
    update: body => {
      if (body.stateTime >= body.cannon.fireTime) body.setState('idle')
    },
  },
  dead: vehicleStates.dead,
}

/** A vehicle with a fixed gun. Its mission decides whether to order a stationary shot. */
export default class CannonVehicle extends Vehicle {
  constructor({ cannon, targets = [], groundAt = () => 0, canFire = () => true, random = Math.random, initial = 'idle', ...options } = {}) {
    super({ ...options, states, initial: 'idle' })
    Object.assign(this, { cannon, targets, canFire })
    this.shells = new ProjectilePool(() => new Shell({ groundAt, random, gravity: this.gravity, fall: tank.shellFall }))
    this.setState(initial)
  }

  get muzzle() {
    const { ahead, aboveGround } = this.cannon
    return { x: this.x + this.forward * ahead, y: this.y - this.size.height / 2 + aboveGround, z: this.z }
  }

  setState(name) {
    if (name === 'attack' && !this.canFire()) return
    super.setState(name)
  }

  shoot() {
    if (this.dead || this.state === 'attack' || !this.canFire()) return false
    this.setState('attack')
    return true
  }

  update(dt) {
    super.update(dt)
    this.shells.update(dt, this.targets)
  }
}
