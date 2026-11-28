import * as THREE from 'three'
import Cooldown from '/core/gameplay/Cooldown.js'
import Health from '/core/gameplay/Health.js'

/**
 * A German field gun: it fires at its target nearer than `reach` metres, every `interval` seconds and first after
 * `firstShot`; its shell lands within `spread` of a metre in each of the distance away, so it misses more often far off,
 * and hits the target within `hitRadius` metres of its middle for `damage`. Its barrel is `height` metres up; a shell of
 * the tank's gun takes its `health` (owner, 2026-11-28: the guns of Kraljevo fire at the tank).
 */
export const enemyGun = { reach: 80, interval: 6, firstShot: 3, spread: .03, hitRadius: 1.6, damage: 100, health: 100, height: 1.2 }

const from = new THREE.Vector3(), way = new THREE.Vector3()

/**
 * A gun at `x`, `z` firing at `target`, which has `x`, `y`, `z`, `alive`, `takeHit` and the `mesh` the shell may strike;
 * the meshes of `world` stand in the way. `clock` is the game clock. Views read `yaw`, `shotsFired`, `blasts`, `lastBlast`
 * and `dead`.
 */
export default class EnemyGun {
  constructor({ x, z, target, world, clock, random = Math.random }) {
    Object.assign(this, { x, z, target, world, random })
    this.y = enemyGun.height
    this.yaw = 0
    this.health = new Health({ maximum: enemyGun.health })
    this.reload = new Cooldown({ seconds: enemyGun.interval, clock })
    this.reload.start(enemyGun.firstShot)
    this.raycaster = new THREE.Raycaster()
    this.shotsFired = 0
    this.blasts = 0
    this.lastBlast = new THREE.Vector3()
  }

  get alive() {
    return this.health.alive
  }

  get dead() {
    return !this.alive
  }

  takeHit(damage) {
    return this.health.damage(damage)
  }

  /** It turns to its target, and fires as soon as it has reloaded while the target is in reach. */
  update() {
    const { target } = this
    if (this.dead || !target.alive) return
    const distance = Math.hypot(target.x - this.x, target.z - this.z)
    if (distance > enemyGun.reach) return
    this.yaw = Math.atan2(target.x - this.x, target.z - this.z)
    if (this.reload.ready) this.fire(distance)
  }

  /** A shell at the target: it bursts on whatever stands in its way, or by the target, which it hits if near enough. */
  fire(distance) {
    const { target } = this
    const spread = enemyGun.spread * distance
    const angle = this.random() * Math.PI * 2, off = Math.sqrt(this.random()) * spread
    const at = new THREE.Vector3(target.x + Math.cos(angle) * off, target.y, target.z + Math.sin(angle) * off)
    from.set(this.x, this.y, this.z)
    this.raycaster.set(from, way.copy(at).sub(from).normalize())
    this.raycaster.far = from.distanceTo(at)
    const solids = this.world.rigidBodies.filter(mesh => mesh !== target.mesh)
    for (const mesh of solids) mesh.updateMatrixWorld()
    const [wall] = this.raycaster.intersectObjects(solids, true)
    if (wall) at.copy(wall.point)
    else if (off < enemyGun.hitRadius) target.takeHit(enemyGun.damage)
    this.lastBlast.copy(at)
    this.shotsFired++
    this.blasts++
    this.reload.start()
  }
}
