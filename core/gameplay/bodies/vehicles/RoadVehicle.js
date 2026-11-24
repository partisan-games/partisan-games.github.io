import Vehicle, { vehicleStates } from './Vehicle.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Shell from '../projectiles/Shell.js'
import { modelStatistics } from '../../modelStatistics.js'
import profiles from '../../roadVehicleProfiles.js'

export const roadVehicleKinds = Object.fromEntries(Object.entries(profiles).map(([id, profile]) =>
  [id, { ...profile, physical: modelStatistics[profile.physicalModel ?? id] }]))

/** Fixed-gun road vehicles and unarmed transport, sharing their art and physical profiles across scenes. */
export default class RoadVehicle extends Vehicle {
  constructor({ kind, clock, targets = [], canFire = () => true, ...rest }) {
    const states = kind.armed ? { ...vehicleStates, attack: { update: body => {
      vehicleStates.move.update(body)
      body.shoot()
    } } } : vehicleStates
    super({ kind, states, ...rest })
    Object.assign(this, { targets, canFire })
    this.aimPoint = null
    this.reload = new Cooldown({ seconds: kind.gun.reload, clock })
    this.reload.start(1.5)
    this.shells = new ProjectilePool(() => new Shell({ fall: 0,
      damage: { min: kind.gun.damage, max: kind.gun.damage } }))
  }

  get muzzle() {
    const { ahead, above } = this.kind.gun.muzzle
    return { x: this.x + this.forward * ahead, y: this.y + above, z: this.z }
  }

  get reach() {
    return Infinity
  }
  get shots() {
    return this.kind.armed ? { straight: { x: 15, y: 0 } } : {}
  }

  aimAt(point) {
    if (!this.kind.armed || this.forward * (point.x - this.muzzle.x) <= 0) return false
    this.aimPoint = { x: point.x, y: point.y }
    return true
  }

  shoot() {
    if (this.dead || !this.kind.armed || !this.aimPoint || !this.canFire() || !this.reload.ready) return false
    const { muzzle } = this
    const pitch = Math.atan2(this.aimPoint.y - muzzle.y, Math.abs(this.aimPoint.x - muzzle.x))
    this.shells.fire(muzzle, this.yaw, pitch, this.kind.gun.speed)
    this.shotsFired++
    this.reload.start()
    return true
  }

  update(dt) {
    super.update(dt)
    this.shells.update(dt, this.targets)
  }
}
