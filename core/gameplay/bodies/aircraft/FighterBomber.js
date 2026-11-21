import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'

/**
 * A fighter-bomber seen from above, measured from the earlier pixel plane at 10 px a metre and 60 frames a second:
 * the push of a key in metres a second squared and the share of that speed kept each second; seconds between shots
 * and the bullet speed; bombs and loops it starts with; a loop's seconds and how far ahead it comes down.
 */
export const fighterBomber = {
  thrust: 186, keep: .9 ** 60, reload: .1, bulletSpeed: 100, bombs: 3, loops: 3, loop: { duration: 1, ahead: 6 },
}
/** The guns of each fire level, from the start up: metres across from the nose, radians off straight ahead. */
export const fireLevels = [
  [{ across: 0, angle: 0 }],
  [{ across: -1.2, angle: 0 }, { across: 1.2, angle: 0 }],
  [{ across: 0, angle: -.33 }, { across: 0, angle: 0 }, { across: 0, angle: .33 }],
]

/** The plane flies as it is steered; set to fire, it also fires as often as it reloads; or it is shot down. */
const states = {
  fly: {},
  fire: { update: plane => plane.shoot() },
  dead: {
    enter: plane => {
      plane.loopAge = null
    },
  },
}

/**
 * A fighter-bomber seen from above, flying up the view (yaw π/2) within `bounds` ({ minX, maxX, minZ, maxZ }, metres
 * the scene moves), at its height (`lift` 1) or lower down to the ground (`lift` 0). Any hit shoots it down, unless it
 * is safe: for `shield` seconds, which the scene gives it, through a loop, and below its height, out of the fight. Its guns hit the living ones of `targets`; flying into a living one of `solids` takes one hit off
 * that one and shoots it down. Its bombs are the scene's to burst. `clock` is the game clock, and it fires only while
 * `canFire()`.
 */
export default class FighterBomber extends Body {
  constructor({ size = { length: 15, height: 2, width: 12.75 }, clock, targets = [], solids = [], bounds = null,
    canFire = () => true, random = Math.random, view = null, ...rest } = {}) {
    super({ size, health: 1, yaw: Math.PI / 2, ...rest, states, initial: 'fly' })
    Object.assign(this, { targets, solids, bounds, canFire })
    this.fireLevel = 0
    this.bombs = fighterBomber.bombs
    this.bombsDropped = 0
    this.loopsLeft = fighterBomber.loops
    /** Seconds into the loop, while it lasts, and the seconds it is safe after coming back. */
    this.loopAge = null
    this.shield = 0
    this.lift = 1
    this.reload = new Cooldown({ seconds: fighterBomber.reload, clock })
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: 1, max: 1 }, random }))
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

  /** The guns are fixed, so it can fire only at a point ahead of it. */
  aimAt(point) {
    return point.z < this.z
  }

  /** Pushes it across the view, `x` and `z` -1, 0 or 1 each. */
  steer(x, z, dt) {
    if (this.dead) return
    this.vx += x * fighterBomber.thrust * dt
    this.vz += z * fighterBomber.thrust * dt
  }

  /** One bullet from every gun of its fire level, if it has reloaded; returns whether it fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.reload.ready) return false
    for (const { across, angle } of fireLevels[this.fireLevel])
      this.bullets.fire({ x: this.x + across, y: this.y, z: this.z - this.size.width / 4 }, Math.PI / 2 - angle, 0,
        fighterBomber.bulletSpeed)
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

  /** Any hit shoots it down, unless it is safe. */
  takeHit(damage) {
    if (this.invulnerable) return false
    return super.takeHit(damage)
  }

  /** Its bombs filled again, as on an airfield; more than a full load, from power-ups, it keeps. */
  rearm() {
    this.bombs = Math.max(this.bombs, fighterBomber.bombs)
  }

  /** Back in the air, whole, with its loops and its first fire level. */
  revive() {
    this.health.reset()
    this.setState('fly')
    this.vx = this.vz = 0
    this.loopsLeft = fighterBomber.loops
    this.fireLevel = 0
  }

  /** It comes down from a loop a little ahead of where it began. */
  flyLoop(dt) {
    const lift = progress => Math.sin(Math.PI * progress)
    const before = this.loopProgress
    this.loopAge += dt
    const progress = this.loopProgress
    this.z -= fighterBomber.loop.ahead * (lift(progress) - lift(before))
    if (progress === 1) this.loopAge = null
  }

  /** A living one of `solids` it flies into takes a hit and shoots it down, unless it is safe. */
  checkCrashes() {
    if (this.dead || this.invulnerable) return
    const crashed = this.solids.find(body => body.alive && this.overlaps(body))
    if (!crashed) return
    crashed.takeHit(1)
    this.setState('dead')
  }

  overlaps(body) {
    return Math.abs(body.x - this.x) < (body.size.length + this.size.length) / 2 &&
      Math.abs(body.z - this.z) < (body.size.width + this.size.width) / 2
  }

  /** The edges of the view stop it: a quarter of its span may leave at the sides, none of it at the top or bottom. */
  keepInBounds() {
    if (!this.bounds) return
    const { minX, maxX, minZ, maxZ } = this.bounds
    const side = this.size.length / 4, end = this.size.width / 2
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
