import * as THREE from 'three'
import { Ammo } from './index.js'
import Cooldown from '/core/gameplay/Cooldown.js'

/**
 * A tank's gun, a 37 mm as on the Renault and Hotchkiss of 1941: held, the trigger charges the shot from the least to
 * the most of `range` metres, `charge` metres a second, as the other guns of the games charge their power; let go, it
 * fires, once every `reload` seconds. Its shell bursts on the first thing it meets within the charged range, or on the
 * ground there; the burst takes up to `damage` off everyone within
 * `radius` metres, less the farther off, and throws loose things within it away at up to `throw` metres a second.
 * A target nearer than `hitWidth` metres to the line of fire is hit outright.
 */
export const tankGun = { reload: 1.5, range: [20, 120], charge: 50, radius: 4, damage: 100, throw: 12, hitWidth: .8 }

const point = new THREE.Vector3(), away = new THREE.Vector3()

/**
 * The gun of `tank`, a physics vehicle with `mesh`, `height`, `depth` and `input`, in its physics `world`: it fires
 * along the tank's nose when `input.attack` is let go, as far as `power` it charged, at the living ones of `targets`, bodies with `x`, `y`, `z` and
 * `takeHit`, and at whatever stands in the world. `clock` is the game clock. Views read `shotsFired`, `blasts`,
 * `lastBlast` and `lastScar`, where the last shell struck something fixed, as a wall: a ray intersection, or null.
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
    this.held = false
    this.power = tankGun.range[0]
  }

  /** Where the shell leaves the barrel, and the way it flies. */
  get line() {
    const { mesh, height, depth } = this.tank
    mesh.updateMatrixWorld()
    // the mesh is centred on the tank, so the turret is a quarter of its height above
    const muzzle = mesh.localToWorld(new THREE.Vector3(0, height * .25, depth * .5))
    return { muzzle, way: mesh.getWorldDirection(new THREE.Vector3()) }
  }

  /** Fires as far as `range` metres if it has reloaded; returns whether it fired. */
  fire(range = this.power) {
    if (!this.reload.ready) return false
    const { muzzle, way } = this.line
    this.raycaster.set(muzzle, way)
    this.raycaster.far = range
    const solids = this.world.rigidBodies.filter(mesh => mesh !== this.tank.mesh)
    // the physics moves the meshes after the last frame was drawn
    for (const mesh of solids) mesh.updateMatrixWorld()
    let [impact] = this.raycaster.intersectObjects(solids, true)
    let reach = impact?.distance ?? range
    let struck = null
    for (const target of this.targets) {
      if (!target.alive) continue
      const along = point.set(target.x, target.y, target.z).sub(muzzle).dot(way)
      if (along <= 0 || along >= reach) continue
      const aside = point.sub(away.copy(way).multiplyScalar(along)).length()
      if (aside < tankGun.hitWidth) [reach, struck] = [along, target]
    }
    let at = struck ? new THREE.Vector3(struck.x, struck.y, struck.z) : way.clone().multiplyScalar(reach).add(muzzle)
    if (!struck && !impact) {
      // spent at its range, the shell comes down on the ground below
      this.raycaster.set(point.copy(at).setY(at.y + 50), away.set(0, -1, 0))
      this.raycaster.far = Infinity
      ;[impact] = this.raycaster.intersectObjects(solids, true)
      if (impact) at = impact.point.clone()
    }
    // a shell that meets a soldier bursts on him; one that strikes a fixed thing scars it
    this.lastScar = !struck && impact && this.fixed(impact.object) ? impact : null
    this.burst(at)
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

  /** Held, the trigger charges the shot; let go, the shot leaves and the charge starts over. */
  update(dt) {
    const held = Boolean(this.tank.input.attack)
    const [least, most] = tankGun.range
    if (held) this.power = Math.min(most, this.power + tankGun.charge * dt)
    else if (this.held) {
      this.fire()
      this.power = least
    }
    this.held = held
  }

  end() {}
}
