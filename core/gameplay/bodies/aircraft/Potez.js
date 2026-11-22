import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import Bomb from '../projectiles/Bomb.js'
import { turn } from '../../angles.js'
import { earthGravity } from '../../gravity.js'

/**
 * Airspeed in metres a second: at takeoff, the slowest and fastest flight, and the change a second of full throttle.
 * Full throttle adds 19.5 to the takeoff speed. Measured from the earlier pixel plane at 30.8 px a metre and 30 frames a
 * second.
 */
export const airspeed = { start: 10.14, min: 6.5, max: 29.64, throttle: 4.87 }
/**
 * How the plane handles: the push of a key across the view and up or down, in metres a second squared, and the share
 * of that speed kept each second; how much harder than its world a shot down plane dives; how fast the nose tilts as it
 * climbs or dives, and how far, in radians; how fast a shot down plane tumbles nose over tail; and the share of its
 * airspeed it keeps each second rolling on the ground, and how fast it settles flat after impact, in radians a second.
 */
export const flight = {
  thrust: 30.21, keep: .9 ** 30, wreckFall: 87.64 / earthGravity, tiltRate: .3, maxTilt: .066, tumbleRate: 2.5,
  rollOut: .9 ** 30, settleRate: 4,
}
/**
 * The plane: its health, under half of which the damaged engine smokes; how high above the ground it can climb, in
 * metres; rounds of the gun, about 20 seconds of fire; bombs per flight, chosen for play; seconds between two bombs,
 * so a quick tapping cannot drop the whole load on one spot; the health a glancing blow from a falling wreck takes,
 * for play, where a live enemy destroys the plane; and the shares of its fastest airspeed and of its ceiling left to
 * its damaged engine.
 */
export const plane = {
  health: 100, ceiling: 180.36, ammo: 200, bombs: 4, bombInterval: 1, wreckDamage: 50, damaged: { speed: .75, ceiling: .6 },
}
/** The front machine gun: seconds between shots and bullet speed in metres a second, as the guns in Vis. */
export const gun = { reload: .1, speed: 32.5 }
/**
 * The observer's twin gun fires back at fighters: its reach in metres, the widest angle off straight back and the
 * seconds between shots; how fast it swings back with nothing to aim at, in radians a second; its mount ahead of the
 * plane's centre and above it, and its barrel's length, in metres. Its rounds are not counted, so it fires on when the
 * front gun is empty.
 */
export const rearGun = { reach: 19.5, cone: Math.PI / 3, reload: .2, swing: 4, mount: { ahead: .18, above: .61 }, length: .68 }

/**
 * The plane stands on the ground (`idle`) until it takes off, flies (`move`), flies firing its front gun as it reloads
 * (`attack`), falls shot down and settles after impact (`falling`), then lies wrecked (`dead`). Firing and bombing
 * are also commands that go with flight. A falling plane has no health and cannot be controlled.
 */
const states = {
  idle: {},
  move: {},
  attack: { update: plane => plane.shoot() },
  // it keeps its airspeed as it starts to fall
  falling: {
    enter: plane => {
      if (plane.alive) plane.health.damage(plane.health.current)
      plane.vy = 0
    },
  },
  dead: {
    enter: plane => {
      plane.pitch = 0
      plane.y = plane.groundAt(plane.x) + plane.size.height / 2
      plane.vx = plane.vy = plane.airspeed = plane.across = 0
    },
  },
}

/**
 * Franjo Kluz's Potez 25, flying right. Its speed is its airspeed, at which the scene's view moves on, plus its speed
 * across the view, which `bounds` (the view's left and right, in metres, an object the scene moves) keeps it within.
 * It stands on `groundAt(x)` and flies up to its ceiling. Its front gun hits the living ones of `targets`; the observer
 * fires his gun on his own at the one of `fighters` he aims at, while it is within his reach and cone; flying into a living one of `solids` destroys both, into a wreck damages it once. Its bombs burst on
 * the ground, where `onBombImpact(point)` deals the damage. `clock` is the game clock, and it fires only while
 * `canFire()`. In level flight its wings hold it up; a game that wants it to sink unless it is flown gives `sink`, in
 * metres a second squared.
 */
export default class Potez extends Body {
  constructor({ clock, groundAt = () => 0, bounds = { min: -Infinity, max: Infinity }, targets = [], fighters = [],
    solids = [], canFire = () => true, onBombImpact = () => {}, onGround = false, sink = 0, random = Math.random, view = null,
    ...rest } = {}) {
    super({ size: { length: 7.14, height: 3.09, width: 8.86 }, health: plane.health, ...rest, states, initial: onGround ? 'idle' : 'move' })
    Object.assign(this, { groundAt, bounds, targets, fighters, solids, canFire, sink })
    this.airspeed = onGround ? 0 : airspeed.start
    /** Speed across the view, on top of the airspeed the view keeps. */
    this.across = 0
    this.vx = this.airspeed
    if (onGround) this.y = groundAt(this.x) + this.size.height / 2
    this.ammo = plane.ammo
    this.bombs = plane.bombs
    this.bombsDropped = 0
    /** Whether the shot down plane has hit the ground. */
    this.wrecked = false
    /** Airspeed and sink rate when the wheels last touched the ground; null in the air. */
    this.touchdown = null
    /** Whether a key tilted the nose this step, so it does not level out. */
    this.tilted = false
    /** Wrecks it has flown into, which damage it only once. */
    this.grazed = new Set()
    const bullet = () => new Bullet({ view, random })
    this.bullets = new ProjectilePool(bullet)
    this.rearBullets = new ProjectilePool(bullet)
    this.reload = new Cooldown({ seconds: gun.reload, clock })
    this.rearReload = new Cooldown({ seconds: rearGun.reload, clock })
    this.bombInterval = new Cooldown({ seconds: plane.bombInterval, clock })
    this.bombBay = Array.from({ length: plane.bombs }, () => new Bomb({ gravity: this.gravity, groundAt, onImpact: onBombImpact }))
    /** The fighter the observer aims at, and where his gun points, in radians from +x; at rest straight back. */
    this.rearTarget = null
    this.rearAim = Math.PI
  }

  get forward() {
    return 1
  }

  /** Destruction starts the fall; `dead` is reached only after ground contact and settling. */
  setState(name) {
    super.setState(name === 'dead' && !this.wrecked ? 'falling' : name)
  }

  /** A falling airframe touches the ground with its rotated outline, rather than its level wheels. */
  get groundClearance() {
    if (this.alive) return this.size.height / 2
    return (Math.abs(Math.sin(this.pitch)) * this.size.length + Math.abs(Math.cos(this.pitch)) * this.size.height) / 2
  }

  get isGrounded() {
    return this.y - this.groundClearance <= this.groundAt(this.x) + 1e-9
  }

  /** How high it can climb: lower with a damaged engine. */
  get ceiling() {
    return plane.ceiling * (this.damaged ? plane.damaged.ceiling : 1)
  }

  /** Its fastest airspeed: slower with a damaged engine. */
  get topSpeed() {
    return airspeed.max * (this.damaged ? plane.damaged.speed : 1)
  }

  get atCeiling() {
    return this.y + this.size.height / 2 >= this.ceiling
  }

  /** Its engine is damaged under half its health: it smokes, and pulls less. */
  get damaged() {
    return this.alive && this.health.current < plane.health / 2
  }

  /** A damaged plane smokes and a shot down one burns. */
  get burning() {
    return this.dead || this.damaged
  }

  /** Throttle up: faster through the air, and forward across the view. */
  speedUp(dt) {
    this.airspeed = Math.min(this.topSpeed, this.airspeed + airspeed.throttle * dt)
    this.across += flight.thrust * dt
  }

  /** Throttle down: slower, and back across the view; not on the ground. */
  slowDown(dt) {
    if (this.isGrounded) return
    this.airspeed = Math.max(airspeed.min, this.airspeed - airspeed.throttle * dt)
    this.across -= flight.thrust * dt
  }

  /** Climbs, nose up, below the ceiling; on the ground it takes off at takeoff speed. */
  climb(dt) {
    if (this.atCeiling || this.dead) return
    if (this.isGrounded) this.airspeed = Math.max(this.airspeed, airspeed.start)
    if (this.state === 'idle') this.setState('move')
    this.vy += flight.thrust * dt
    if (this.pitch >= 0 && this.pitch <= flight.maxTilt) this.pitch += flight.tiltRate * dt
    this.tilted = true
  }

  /** Dives, nose down; not on the ground. */
  dive(dt) {
    if (this.isGrounded || this.dead) return
    this.vy -= flight.thrust * dt
    if (this.pitch <= 0 && this.pitch >= -flight.maxTilt) this.pitch -= flight.tiltRate * dt
    this.tilted = true
  }

  /** The gun fires from the nose where the nose points, with the plane's velocity; returns whether it fired. */
  shoot() {
    if (this.dead || !this.canFire() || !this.ammo || !this.reload.ready) return false
    this.launch(this.bullets, this.ahead(this.size.length / 2), this.yaw, this.pitch)
    this.reload.start()
    this.ammo--
    return true
  }

  /** Aims the observer's gun at `fighter`, or with none lets it swing back. */
  aimBack(fighter) {
    this.rearTarget = fighter
  }

  /**
   * The shot a story can ask of the observer, as the point behind the plane and below it, inside his cone; aimed, he
   * fires on his own.
   */
  get shots() {
    return { behind: { x: -12, y: -4, automatic: true } }
  }

  /** Aims the observer's gun at `point`, if he can fire back at it; returns whether he can. */
  aimAt(point) {
    if (!this.canFireBackAt(point)) return false
    this.aimBack(point)
    return true
  }

  /** The observer fires at the fighter he aims at, while it is within his reach and cone, as his gun reloads; returns whether he fired. */
  fireBack() {
    if (this.dead || !this.canFire() || !this.rearTarget || !this.rearReload.ready || !this.canFireBackAt(this.rearTarget))
      return false
    this.rearAim = this.angleTo(this.rearTarget)
    this.launch(this.rearBullets, this.rearMuzzle, Math.cos(this.rearAim) < 0 ? Math.PI : 0,
      Math.atan2(Math.sin(this.rearAim), Math.abs(Math.cos(this.rearAim))))
    this.rearReload.start()
    return true
  }

  launch(pool, point, yaw, pitch) {
    const round = pool.fire(point, yaw, pitch, gun.speed)
    round.vx += this.vx
    round.vy += this.vy
    this.shotsFired++
  }

  angleTo(point) {
    return Math.atan2(point.y - this.y, point.x - this.x)
  }

  /** Whether `fighter` is behind the plane within the observer's reach and cone. */
  canFireBackAt(fighter) {
    return Math.hypot(fighter.x - this.x, fighter.y - this.y) <= rearGun.reach &&
      Math.abs(turn(Math.PI, this.angleTo(fighter))) <= rearGun.cone
  }

  /** Where the observer's gun turns, on the airframe as it is tilted. */
  get rearMount() {
    const { ahead, above } = rearGun.mount
    const cos = Math.cos(this.pitch), sin = Math.sin(this.pitch)
    return { x: this.x + ahead * cos - above * sin, y: this.y + ahead * sin + above * cos, z: this.z }
  }

  /** The tip of the observer's barrel, where its bullets leave. */
  get rearMuzzle() {
    const { x, y, z } = this.rearMount
    return { x: x + Math.cos(this.rearAim) * rearGun.length, y: y + Math.sin(this.rearAim) * rearGun.length, z }
  }

  /** Drops one bomb from under the wings with the plane's velocity, no faster than its interval; not on the ground. */
  dropBomb() {
    if (this.dead || !this.canFire() || this.isGrounded || !this.bombs || !this.bombInterval.ready) return false
    const bomb = this.bombBay.find(free => !free.active)
    if (!bomb) return false
    this.bombs--
    this.bombsDropped++
    this.bombInterval.start()
    bomb.release({ x: this.x, y: this.y - this.size.height / 4, z: this.z }, this)
    return true
  }

  /** The gun follows the fighter it aims at and, with none, swings back to point straight back. */
  swingRearGun(dt) {
    if (this.alive && this.rearTarget) {
      this.rearAim = this.angleTo(this.rearTarget)
      return
    }
    const rest = this.pitch + Math.PI
    const left = turn(this.rearAim, rest)
    const step = rearGun.swing * dt
    this.rearAim = Math.abs(left) <= step ? rest : this.rearAim + Math.sign(left) * step
  }

  /** The edges of the view, the ground and the ceiling stop the plane; a shot down plane is wrecked by the ground. */
  checkBounds(before) {
    const margin = this.size.length / 4
    const left = this.bounds.min + margin, right = this.bounds.max - margin
    if (this.x < left || this.x > right) {
      this.x = Math.min(right, Math.max(left, this.x))
      this.across = 0
    }
    if (!this.isGrounded) this.touchdown = null
    else {
      this.touchdown ??= { airspeed: this.airspeed, sink: -this.vy }
      this.y = this.groundAt(this.x) + this.groundClearance
      if (this.vy < 0) this.vy = 0
      if (this.dead && !this.wrecked) this.wreck()
    }
    if (this.atCeiling && this.vy > 0) {
      this.vy = 0
      // it rises no higher than its ceiling, or than it was if a damaged engine left it above its lower one
      this.y = Math.max(this.ceiling - this.size.height / 2, Math.min(this.y, before))
    }
  }

  /** The airframe hits the ground and stops travelling, but still has to settle flat. */
  wreck() {
    this.wrecked = true
    this.airspeed = this.across = this.vx = this.vy = 0
    this.pitch = turn(0, this.pitch)
  }

  /** Keeps the lowest corner on the ground as the tail lowers, ending at the wreck's level baseline. */
  settle(dt) {
    const step = flight.settleRate * dt
    this.pitch = Math.abs(this.pitch) <= step ? 0 : this.pitch - Math.sign(this.pitch) * step
    this.y = this.groundAt(this.x) + this.groundClearance
    if (this.pitch === 0) this.setState('dead')
  }

  /** A live one of `solids` destroys the plane and itself; a wreck damages it once. */
  checkCollisions() {
    if (this.dead) return
    for (const body of this.solids) {
      if (!this.overlaps(body) || this.grazed.has(body)) continue
      if (body.dead) {
        this.grazed.add(body)
        this.takeHit(plane.wreckDamage)
        continue
      }
      this.setState('dead')
      body.setState('dead')
      return
    }
  }

  overlaps(body) {
    return Math.abs(body.x - this.x) < (body.size.length + this.size.length) / 2 &&
      Math.abs(body.y - this.y) < (body.size.height + this.size.height) / 2
  }

  /** Back to level once no key tilts the nose, exactly, however long the steps. */
  levelOut(dt) {
    if (this.tilted || this.dead || !this.pitch) return
    const step = flight.tiltRate * dt
    this.pitch = Math.abs(this.pitch) <= step ? 0 : this.pitch - Math.sign(this.pitch) * step
  }

  update(dt) {
    const wasWrecked = this.wrecked
    if (this.dead && !this.wrecked) this.pitch -= flight.tumbleRate * dt
    // on the ground the plane rolls out
    if (this.isGrounded) this.airspeed *= flight.rollOut ** dt
    // a damaged engine cannot hold its former speed: the plane slows to what it still pulls
    else if (this.airspeed > this.topSpeed) this.airspeed = Math.max(this.topSpeed, this.airspeed - airspeed.throttle * dt)
    this.vx = this.airspeed + this.across
    const before = this.y
    super.update(dt)
    this.checkBounds(before)
    const keep = flight.keep ** dt
    this.vy *= keep
    this.across *= keep
    this.checkCollisions()
    this.bullets.update(dt, this.targets)
    this.rearBullets.update(dt, this.fighters)
    for (const bomb of this.bombBay) bomb.update(dt)
    if (!this.isGrounded) this.vy -= (this.dead ? this.gravity * flight.wreckFall : this.sink) * dt
    this.levelOut(dt)
    this.tilted = false
    if (wasWrecked && this.state === 'falling') this.settle(dt)
    this.swingRearGun(dt)
    this.fireBack()
  }
}
