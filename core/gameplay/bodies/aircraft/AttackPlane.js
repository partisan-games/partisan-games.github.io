import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/** Its bullets' speed in metres a second. */
export const attackPlane = { bulletSpeed: 35 }

/**
 * Each kind seen from above, measured from the earlier pixel planes at 10 px a metre: its size, how many hits bring it
 * down, its speed in metres a second, and its guns: seconds between shots, the angles of one shot, and where across
 * its span they fire from in turn. The boss keeps its nose down wherever it flies.
 */
export const attackPlaneKinds = {
  fighter: { size: { length: 11.5, height: 2, width: 9.8 }, hits: 1, speed: 19, fire: { interval: 2.5, spread: [0] }, guns: [0] },
  heavy: { size: { length: 17.7, height: 2.5, width: 13.25 }, hits: 5, speed: 11, fire: { interval: 2, spread: [-.25, 0, .25] },
    guns: [0] },
  boss: { size: { length: 41, height: 3, width: 29.55 }, hits: 60, speed: 6, steady: true,
    fire: { interval: 1.2, spread: [-.5, -.25, 0, .25, .5] }, guns: [0, -.35, .35] },
}

/**
 * The plane flies where it is put; set to fire, it also fires where it aims as often as its guns reload; shot down, it
 * flies on straight ahead.
 */
const states = {
  idle: {},
  fire: { update: plane => plane.shoot() },
  dead: {
    enter: plane => {
      plane.vx = Math.cos(plane.yaw) * plane.kind.speed
      plane.vz = -Math.sin(plane.yaw) * plane.kind.speed
    },
  },
}

/**
 * An enemy plane seen from above whose guns turn every way. Its bullets hit the living ones of `targets` for `damage`
 * each; `clock` is the game clock, and it fires only while `canFire()`. Its health is its hits.
 */
export default class AttackPlane extends Body {
  constructor({ kind = attackPlaneKinds.fighter, clock, targets = [], canFire = () => true, damage = 1, random = Math.random, view = null,
    ...rest } = {}) {
    super({ size: kind.size, health: kind.hits, yaw: -Math.PI / 2, ...rest, states })
    Object.assign(this, { kind, targets, canFire, random })
    this.aim = null
    this.gunIndex = 0
    this.reload = new Cooldown({ seconds: kind.fire.interval, clock })
    // the planes of a formation do not fire together
    this.reload.start(kind.fire.interval * random())
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: damage, max: damage }, random }))
  }

  get forward() {
    return 1
  }

  /** Turns its nose to `yaw`; the boss keeps its nose down. */
  face(yaw) {
    if (!this.kind.steady) this.yaw = yaw
  }

  get burning() {
    return this.dead || this.health.current <= this.kind.hits / 2
  }

  /** The guns turn every way, so it fires down at the shot. */
  get shots() {
    return { straight: { x: 0, y: 0, z: 30 } }
  }

  get reach() {
    return Infinity
  }

  /** Its guns turn every way: it aims at `point` wherever it flies, and can fire there while it may. */
  aimAt(point) {
    this.aim = point
    return this.canFire()
  }

  /** Where the next shot leaves from: its guns in turn across its span. */
  nextGun() {
    const { guns } = this.kind
    const across = guns[this.gunIndex++ % guns.length] * this.size.length
    return { x: this.x + across, y: this.y, z: this.z }
  }

  /** Fires every barrel at where it aims, if its guns have reloaded; each wait is a little longer or shorter. */
  shoot() {
    if (this.dead || !this.aim || !this.canFire() || !this.reload.ready) return false
    const gun = this.nextGun()
    const yaw = Math.atan2(-(this.aim.z - gun.z), this.aim.x - gun.x)
    for (const angle of this.kind.fire.spread) this.bullets.fire(gun, yaw - angle, 0, attackPlane.bulletSpeed)
    this.shotsFired++
    this.reload.start(this.kind.fire.interval * (.8 + this.random() * .4))
    return true
  }

  /** Its bullets in the air still hit after it is shot down. */
  update(dt) {
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
