import Vehicle, { vehicleKinds, vehicleStates } from './Vehicle.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'
import { tank } from './Tank.js'

/** One stationary discharge and recoil cycle; existing controllers still decide whether to order a shot. */
export const hummel = { fireTime: .8 }
export const hummelKind = vehicleKinds.tank

const states = {
  ...vehicleStates,
  fire: {
    enter: body => {
      body.vx = 0
      body.shells.fire(body.muzzle, body.yaw, 0, tank.shellSpeed)
      body.shotsFired++
    },
    update: body => {
      if (body.stateTime >= hummel.fireTime) body.setState('idle')
    },
  },
}

/** Hummel keeps its original vehicle health and drive; its fixed cannon can now be commanded to fire. */
export default class Hummel extends Vehicle {
  constructor({ targets = [], groundAt = () => 0, canFire = () => true, random = Math.random, ...rest } = {}) {
    super({ kind: hummelKind, ...rest, states, initial: 'idle' })
    Object.assign(this, { targets, canFire })
    this.shells = new ProjectilePool(() => new Shell({ groundAt, random, gravity: tank.shellGravity }))
  }

  get muzzle() {
    const pixel = Math.min(this.size.length / 298, this.size.height / 138)
    return { x: this.x + this.forward * (338 - 192) * pixel,
      y: this.y - this.size.height / 2 + (156 - 54) * pixel, z: this.z }
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    if (name === 'fire' && !this.canFire()) return
    super.setState(name)
  }

  shoot() {
    if (this.dead || this.state === 'fire' || !this.canFire()) return false
    this.setState('fire')
    return true
  }

  update(dt) {
    super.update(dt)
    this.shells.update(dt, this.targets)
  }
}
