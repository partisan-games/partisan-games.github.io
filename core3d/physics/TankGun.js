import * as THREE from 'three'
import { Ammo } from './index.js'
import Cooldown from '/core/gameplay/Cooldown.js'

/**
 * A tank's gun, a 37 mm as on the Renault and Hotchkiss of 1941: holding the trigger charges the range, and releasing
 * it fires if the gun has reloaded. Its shell flies from the barrel to the ground at the charged range and bursts on
 * the first thing it meets on the way, or on the ground there; the burst takes up to `damage` off everyone within
 * `radius` metres, less the farther off, and throws loose things within it away at up to `throw` metres a second.
 * A target nearer than `hitWidth` metres to the line of fire is hit outright.
 */
export const tankGun = { reload: 1.5, range: [20, 120], charge: 50, radius: 4, damage: 100, throw: 12, hitWidth: .8 }
export const shellFlight = { speed: 260, minimumTime: .12 }

const point = new THREE.Vector3(), away = new THREE.Vector3()

/** Whether `object` is `whole` or one of its parts. */
const partOf = (object, whole) => {
  for (let part = object; part; part = part.parent) if (part === whole) return true
  return false
}

/**
 * The gun of `tank`, a physics vehicle with `mesh`, `height`, `depth` and `input`, in its physics `world`: it fires
 * along the tank's nose when `input.attack` is released, at the living ones of `targets`, bodies with `x`, `y`, `z` and
 * `takeHit`, and at whatever stands in the world; a target may have a `mesh` among the world's solids, its body, and a
 * shell that strikes it hits that target. `clock` is the game clock. Views read `shotsFired`, `blasts`,
 * `lastShot`, `lastBlast` and `lastScar`, where the last shell struck something fixed, as a wall: a ray intersection, or null;
 * and `lay`, how far below the tank's nose, in radians, the shot being charged would go, which the barrel shows.
 */
export default class TankGun {
  constructor({ tank, world, targets = [], clock }) {
    Object.assign(this, { tank, world, targets })
    this.reload = new Cooldown({ seconds: tankGun.reload, clock })
    this.raycaster = new THREE.Raycaster()
    this.shotsFired = 0
    this.blasts = 0
    this.lastBlast = new THREE.Vector3()
    this.lastScar = null
    this.lastShot = null
    this.held = false
    this.power = tankGun.range[0]
    this.lay = 0
  }

  /** Where the shell leaves the barrel, and the way it flies. */
  get line() {
    const { mesh, height, depth } = this.tank
    mesh.updateMatrixWorld()
    const muzzle = this.tank.muzzle ?? mesh.localToWorld(new THREE.Vector3(0, height * .25, depth * .5))
    return { muzzle, way: mesh.getWorldDirection(new THREE.Vector3()) }
  }

  /**
   * Where a shell fired now would burst, `at`: on the first of the living `targets` near the line of fire, `struck`, or
   * the first thing it meets, `impact`. A shell this fast flies all but straight, and the charged `range` sets where it
   * comes down: it is laid on the ground `range` metres along the barrel, so a weak charge strikes the low things near
   * on the way, as sandbags, and a full one flies over them (owner, 2026-11-28).
   */
  aim(range = tankGun.range[1]) {
    const { muzzle, way: barrel } = this.line
    const solids = this.world.rigidBodies.filter(mesh => mesh !== this.tank.mesh)
    // the physics moves the meshes after the last frame was drawn
    for (const mesh of solids) mesh.updateMatrixWorld()
    const end = barrel.clone().multiplyScalar(range).add(muzzle)
    this.raycaster.set(point.copy(end).setY(end.y + 50), away.set(0, -1, 0))
    this.raycaster.far = Infinity
    const [below] = this.raycaster.intersectObjects(solids, true)
    if (below) end.copy(below.point)
    const way = end.clone().sub(muzzle)
    const length = way.length()
    way.normalize()
    this.raycaster.set(muzzle, way)
    // a little past the end, so that it meets the ground there
    this.raycaster.far = length + .01
    const [impact] = this.raycaster.intersectObjects(solids, true)
    let reach = impact?.distance ?? length
    let struck = impact ? this.targets.find(target => target.alive && target.mesh && partOf(impact.object, target.mesh)) ?? null : null
    for (const target of this.targets) {
      if (!target.alive) continue
      const along = point.set(target.x, target.y, target.z).sub(muzzle).dot(way)
      if (along <= 0 || along >= reach) continue
      const aside = point.sub(away.copy(way).multiplyScalar(along)).length()
      if (aside < tankGun.hitWidth) [reach, struck] = [along, target]
    }
    const at = struck ? new THREE.Vector3(struck.x, struck.y, struck.z) : way.clone().multiplyScalar(reach).add(muzzle)
    return { at, impact, struck, muzzle, way }
  }

  /** Fires as far as `range` metres if it has reloaded; returns whether it fired. */
  fire(range = tankGun.range[1]) {
    const shot = this.lastShot
    if (!this.reload.ready || (shot && shot.age < shot.duration)) return false
    const { at, impact, struck, muzzle, way } = this.aim(range)
    // a shell that meets a soldier bursts on him; one that strikes a fixed thing scars it
    this.lastShot = {
      from: muzzle, to: at, way, scar: !struck && impact && this.fixed(impact.object) ? impact : null,
      age: 0, duration: Math.max(shellFlight.minimumTime, muzzle.distanceTo(at) / shellFlight.speed),
    }
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** Whether `object`, or the solid it is a part of, stands fixed in the world. */
  fixed(object) {
    for (let part = object; part; part = part.parent)
      if (part.userData.body) return part.userData.body.isStaticObject()
    return false
  }

  /** The shell bursts at `at`: it hurts everyone near and throws loose things away from it. */
  burst(at) {
    const { radius } = tankGun
    for (const target of this.targets) {
      const distance = point.set(target.x, target.y, target.z).distanceTo(at)
      if (target.alive && distance < radius) target.takeHit(tankGun.damage * (1 - distance / radius))
    }
    for (const mesh of this.world.rigidBodies) {
      const { body } = mesh.userData
      if (mesh === this.tank.mesh || !body || body.isStaticObject()) continue
      const distance = mesh.getWorldPosition(point).distanceTo(at)
      if (distance >= radius) continue
      const push = away.copy(point).sub(at).setY(Math.max(point.y - at.y, 0) + 1).normalize()
        .multiplyScalar(tankGun.throw * (1 - distance / radius))
      const velocity = body.getLinearVelocity()
      const thrown = new Ammo.btVector3(velocity.x() + push.x, velocity.y() + push.y, velocity.z() + push.z)
      body.setLinearVelocity(thrown)
      body.activate()
      Ammo.destroy(thrown)
    }
    this.lastBlast.copy(at)
    this.blasts++
  }

  /** Hold the trigger to charge the shot and release it to fire. */
  update(dt = 0) {
    const flight = this.lastShot
    if (flight) {
      const previousAge = flight.age
      flight.age += dt
      if (previousAge < flight.duration && flight.age >= flight.duration) {
        this.lastScar = flight.scar
        this.burst(flight.to)
      }
    }
    const held = Boolean(this.tank.input.attack)
    const [min, max] = tankGun.range
    if (held) {
      this.power = Math.min(max, this.power + tankGun.charge * dt)
      const { way } = this.aim(this.power)
      this.lay = Math.asin(this.line.way.y) - Math.asin(way.y)
    } else if (this.held) {
      this.fire(this.power)
      this.power = min
      this.lay = 0
    }
    this.held = held
  }

  end() {}
}
