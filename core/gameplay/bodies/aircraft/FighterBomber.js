import Body from '../Body.js'
import Health from '../../Health.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { hullEntry } from '../projectiles/hits.js'

/**
 * A fighter-bomber seen from above, measured from the earlier pixel plane at 10 px a metre and 60 frames a second:
 * the push of a key in metres a second squared and the share of that speed kept each second; seconds between shots
 * and the bullet speed; bombs and loops it starts with; a loop's seconds and how far ahead it comes down; its energy,
 * in the hits of a bullet it takes, the energy flying into a plane takes and the seconds it is safe after that.
 */
export const fighterBomber = {
  thrust: 186, keep: .9 ** 60, reload: .1, bulletSpeed: 100, bombs: 3, loops: 3, loop: { duration: 1, ahead: 6 },
  health: 10, crash: { damage: 3, shield: 1 },
}
/**
 * How a model of fighter-bomber flies and fights against the plain one: its speed and the damage of each bullet as
 * shares, the hits it takes and the bombs it carries.
 */
export const plainPerformance = { speed: 1, firepower: 1, health: fighterBomber.health, bombs: fighterBomber.bombs }
/** The guns of each fire level, from the start up: metres across from the nose, radians off straight ahead. */
export const fireLevels = [
  [{ across: 0, angle: 0 }],
  [{ across: -1.2, angle: 0 }, { across: 1.2, angle: 0 }],
  [{ across: 0, angle: -.33 }, { across: 0, angle: 0 }, { across: 0, angle: .33 }],
]

/** The plane flies as it is steered; set to attack, it also fires as often as it reloads; or it is shot down. */
const states = {
  move: {},
  attack: { update: plane => plane.shoot() },
  dead: {
    enter: plane => {
      plane.loopAge = null
    },
  },
}

/**
 * A fighter-bomber seen from above, flying up the view (yaw π/2) within `bounds` ({ minX, maxX, minZ, maxZ }, metres
 * the scene moves), at its height (`lift` 1) or lower down to the ground (`lift` 0). Hits take its energy, and it is shot
 * down when none is left, unless it is safe: for `shield` seconds, which the scene gives it, through a loop, and below
 * its height, out of the fight. Its guns hit the living ones of `targets`; flying into a living one of `solids` takes
 * one hit off that one and `crash.damage` off itself. Its bombs are the scene's to burst. `clock` is the game clock, and it fires only while
 * `canFire()`.
 */
export default class FighterBomber extends Body {
  constructor({ size = { length: 9.12, height: 3.86, width: 11.23 }, clock, targets = [], solids = [], bounds = null,
    canFire = () => true, random = Math.random, view = null, performance = plainPerformance, distanceScale = 1, ...rest } = {}) {
    super({ size, yaw: Math.PI / 2, ...rest, states, initial: 'move' })
    Object.assign(this, { targets, solids, bounds, canFire, distanceScale })
    this.fireLevel = 0
    /** The damage every one of its bullets takes, which its model sets. */
    this.bulletDamage = { min: 1, max: 1 }
    this.equip(performance)
    this.bombsDropped = 0
    this.loopsLeft = fighterBomber.loops
    /** Seconds into the loop, while it lasts, and the seconds it is safe after coming back. */
    this.loopAge = null
    this.shield = 0
    this.lift = 1
    this.reload = new Cooldown({ seconds: fighterBomber.reload, clock })
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: this.bulletDamage, random }))
  }

  /** Becomes a model with `performance`: full energy of its own, its bombs and its bullets' damage. */
  equip(performance) {
    this.performance = { ...plainPerformance, ...performance }
    this.health = new Health({ maximum: this.performance.health })
    this.bombs = this.performance.bombs
    this.bulletDamage.min = this.bulletDamage.max = this.performance.firepower
  }

  /** It faces up the view. */
  get forward() {
    return 1
  }

  get looping() {
    return this.loopAge !== null
  }

  /** How far through its loop it is, 0 to 1, or 0 with none. */
  get loopProgress() {
    return this.looping ? Math.min(this.loopAge / fighterBomber.loop.duration, 1) : 0
  }

  /** Under half its energy it smokes. */
  get damaged() {
    return this.alive && this.health.current < this.health.maximum / 2
  }

  get invulnerable() {
    return this.shield > 0 || this.looping || this.lift < 1
  }

  /** The guns point straight up the view. */
  get shots() {
    return { up: { x: 0, y: 0, z: -30 } }
  }

  get reach() {
    return Infinity
  }

  hitTime(start, end) {
    return hullEntry({ start, end }, this)
  }

  /** The guns are fixed, so it can fire only at a point ahead of it. */
  aimAt(point) {
    return point.z < this.z
  }

  /** Pushes it across the view, `x` and `z` -1, 0 or 1 each. */
  steer(x, z, dt) {
    if (this.dead) return
    const thrust = fighterBomber.thrust * this.performance.speed * this.distanceScale
    this.vx += x * thrust * dt
    this.vz += z * thrust * dt
  }

  /** One bullet from every gun of its fire level, if it has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.reload.ready) return false
    for (const { across, angle } of fireLevels[this.fireLevel])
      this.bullets.fire({ x: this.x + across * this.distanceScale, y: this.y, z: this.z - this.size.length / 4 }, Math.PI / 2 - angle, 0,
        fighterBomber.bulletSpeed * this.distanceScale)
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** Climbs into a loop, if it has one left and is not in one. */
  loop() {
    if (this.dead || !this.loopsLeft || this.looping) return false
    this.loopsLeft--
    this.loopAge = 0
    return true
  }

  /** Drops a bomb if it has one left; the scene bursts it. */
  dropBomb() {
    if (this.dead || !this.bombs) return false
    this.bombs--
    this.bombsDropped++
    return true
  }

  /** A hit takes its energy, unless it is safe. */
  takeHit(damage, source) {
    if (this.invulnerable) return false
    return super.takeHit(damage, source)
  }

  /** Its bombs filled again, as on an airfield; more than a full load, from power-ups, it keeps. */
  rearm() {
    this.bombs = Math.max(this.bombs, this.performance.bombs)
  }

  /** Gets back `share` of its full energy, as from a power-up or on an airfield. */
  repair(share) {
    if (this.alive) this.health.heal(this.health.maximum * share)
  }

  /** It comes down from a loop a little ahead of where it began. */
  flyLoop(dt) {
    const lift = progress => Math.sin(Math.PI * progress)
    const before = this.loopProgress
    this.loopAge += dt
    const progress = this.loopProgress
    this.z -= fighterBomber.loop.ahead * this.distanceScale * (lift(progress) - lift(before))
    if (progress === 1) this.loopAge = null
  }

  /** A living one of `solids` it flies into takes a hit, and it loses energy and is safe a moment, unless it already is. */
  checkCrashes() {
    if (this.dead || this.invulnerable) return
    const crashed = this.solids.find(body => body.alive && this.overlaps(body))
    if (!crashed) return
    crashed.takeHit(1)
    this.takeHit(fighterBomber.crash.damage)
    if (this.alive) this.shield = fighterBomber.crash.shield
  }

  overlaps(body) {
    return Math.abs(body.x - this.x) < (body.size.width + this.size.width) / 2 &&
      Math.abs(body.z - this.z) < (body.size.length + this.size.length) / 2
  }

  /** The edges of the view stop it: a quarter of its span may leave at the sides, none of it at the top or bottom. */
  keepInBounds() {
    if (!this.bounds) return
    const { minX, maxX, minZ, maxZ } = this.bounds
    const side = this.size.width / 4, end = this.size.length / 2
    this.x = Math.min(maxX - side, Math.max(minX + side, this.x))
    this.z = Math.min(maxZ - end, Math.max(minZ + end, this.z))
  }

  update(dt) {
    super.update(dt)
    if (this.looping) this.flyLoop(dt)
    this.shield = Math.max(this.shield - dt, 0)
    const keep = fighterBomber.keep ** dt
    this.vx *= keep
    this.vz *= keep
    this.keepInBounds()
    this.bullets.update(dt, this.targets)
    this.checkCrashes()
  }
}
