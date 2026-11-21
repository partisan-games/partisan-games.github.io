import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Bullet from '../projectiles/Bullet.js'
import { turn } from '../../angles.js'
import { fall } from './wreck.js'

/**
 * An enemy fighter: its level speed and the most it climbs or sinks, in metres a second; how far and how far off its
 * heading it fires, in metres and radians; and its own health in bullet damage. Its `gun` fires a round each `reload`
 * seconds at `speed` metres a second that takes `damage` of a target's health, and rests `pause` seconds after each `burst`
 * of rounds. Measured from the earlier pixel fighter at 30.8 px a metre.
 */
export const fighter = {
  speed: 14.61, climb: 5.84, reach: 22.71, cone: .25, health: 40,
  gun: { reload: .15, speed: 32.5, damage: 5, burst: Infinity, pause: 0 },
}

/**
 * A fighter flies on at the velocity it is steered to, its nose along its path; set to fire, it also fires along its
 * nose as often as its guns let it; shot down, it falls and crashes.
 */
const states = {
  idle: {},
  fire: { update: plane => plane.shoot() },
  dead: {},
}

/**
 * A Bf 109, facing right (yaw 0) or left (yaw π). Its bullets hit the living ones of `targets`; `clock` is the game
 * clock, so reloading waits in a pause, and it fires only while `canFire()`. Its wreck crashes on `groundAt(x)` and
 * `onCrash(point)` destroys what it hits.
 */
export default class Fighter extends Body {
  constructor({ clock, targets = [], canFire = () => true, groundAt = () => 0, onCrash = () => {}, gun = fighter.gun,
    random = Math.random, view = null, ...rest } = {}) {
    super({ size: { length: 6.82, height: 2.23, width: 7.07 }, health: fighter.health, ...rest, states })
    Object.assign(this, { targets, canFire, groundAt, onCrash, gun })
    this.crashed = false
    this.reload = new Cooldown({ seconds: gun.reload, clock })
    this.pause = new Cooldown({ seconds: gun.pause, clock })
    /** Rounds of the burst fired so far. */
    this.burstFired = 0
    this.bullets = new ProjectilePool(() => new Bullet({ view, damage: { min: gun.damage, max: gun.damage }, random }))
  }

  /** The way it flies: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  face(way) {
    this.yaw = way < 0 ? Math.PI : 0
  }

  /** Flies at `vx` and `vy`, climbing or sinking no faster than it can. */
  steer(vx, vy) {
    this.vx = vx
    this.vy = Math.max(-fighter.climb, Math.min(fighter.climb, vy))
  }

  get reach() {
    return fighter.reach
  }

  /** It fires only straight ahead of its nose. */
  get shots() {
    return { straight: { x: 19.5, y: 0 } }
  }

  /** The guns fire only along the nose, climbing or diving, so it can aim only at a point within its cone of fire. */
  aimAt(point) {
    const nose = Math.atan2(Math.sin(this.pitch), this.forward * Math.cos(this.pitch))
    return Math.abs(turn(nose, Math.atan2(point.y - this.y, point.x - this.x))) <= fighter.cone
  }

  /**
   * Fires from its centre along its nose, with its own velocity, if the guns have reloaded and are not resting after
   * a burst; returns whether it fired.
   */
  shoot() {
    if (this.dead || !this.canFire() || !this.reload.ready || !this.pause.ready) return false
    const round = this.bullets.fire({ x: this.x, y: this.y, z: this.z }, this.yaw, this.pitch, this.gun.speed)
    round.vx += this.vx
    round.vy += this.vy
    this.shotsFired++
    this.reload.start()
    if (++this.burstFired < this.gun.burst) return true
    this.burstFired = 0
    this.pause.start()
    return true
  }

  /** It flies nose first; a shot down fighter keeps flying on as it falls. */
  update(dt) {
    if (this.dead) fall(this, dt)
    else if (this.vx || this.vy) this.pitch = Math.atan2(this.vy, this.forward * this.vx)
    super.update(dt)
    this.bullets.update(dt, this.targets)
  }
}
