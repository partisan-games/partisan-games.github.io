import Body from '../Body.js'
import Bomb from '../projectiles/Bomb.js'
import { fall } from './wreck.js'

/**
 * A Ju 87: its level speed, faster than a plane takes off, and its speed straight down, in metres a second; how fast
 * it climbs back to its height after a dive; how fast its nose turns, in radians a second, slow enough that it bends
 * into the dive and out of it in wide arcs; the shallowest dive it
 * takes, in radians below level; how far it sees a target to dive on, how close to the point it aims at a bomb let go
 * must fall, and how high above that point it lets its bomb go at the latest, in metres; its own health in bullet damage, more than a fighter's. Measured from the earlier pixel
 * Ju 87 at 30.8 px a metre.
 */
export const diveBomber = {
  speed: 11.69, diveSpeed: 16.89, climb: 9, pitchRate: 1.2, shallowest: .6, reach: 21.07, spread: .5, releaseHeight: 11.5, health: 60,
}

/** Its speed with its nose at `pitch`: the steeper it dives, the faster. */
const speedAt = pitch => diveBomber.speed + (diveBomber.diveSpeed - diveBomber.speed) * Math.max(0, -Math.sin(pitch))

/**
 * A Ju 87 flies level at its height; set to fire, it dives on the point it aims at, lets its one bomb go as soon as
 * it would fall there, pulls up and climbs back; shot down, it falls and crashes.
 */
const states = {
  idle: { update: (plane, dt) => plane.cruise(dt) },
  move: { update: (plane, dt) => plane.cruise(dt) },
  attack: {
    update: (plane, dt) => {
      if (plane.loaded && plane.aim) plane.dive(dt)
      else plane.cruise(dt)
    },
  },
  dead: {},
}

/**
 * A Ju 87 dive bomber, facing right (yaw 0) or left (yaw π), that carries one bomb a pass and drops it where it
 * aims; it drops it only while `canFire()`. Its bomb and its wreck fall on `groundAt(x)`; `onImpact(point)` destroys
 * what the bomb's burst reaches and `onCrash(point)` what the wreck hits. It does not know what they hit.
 */
export default class DiveBomber extends Body {
  constructor({ canFire = () => true, groundAt = () => 0, onImpact = () => {}, onCrash = () => {}, ...rest } = {}) {
    super({ size: { length: 8.11, height: 3, width: 9.86 }, health: diveBomber.health, ...rest, states })
    Object.assign(this, { canFire, groundAt, onCrash })
    this.crashed = false
    this.bomb = new Bomb({ gravity: this.gravity, groundAt, onImpact })
    this.enter()
  }

  /** The way it flies: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  face(way) {
    this.yaw = way < 0 ? Math.PI : 0
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  /** Starts a pass where it is: it holds this height, level, with a new bomb. */
  enter() {
    this.cruiseY = this.y
    this.pitch = 0
    this.loaded = true
    this.aim = null
    this.steer(diveBomber.speed)
  }

  /** It dives only down ahead of its nose, at least as steep as its shallowest dive. */
  get shots() {
    return { down: { x: 9.71, y: this.groundAt(this.x + this.forward * 9.71) - this.y } }
  }

  get reach() {
    return diveBomber.reach
  }

  /** It can dive on a point ahead of it and below, at least as steep as its shallowest dive; it aims there. */
  aimAt(point) {
    const ahead = this.forward * (point.x - this.x)
    const aimable = ahead > 0 && Math.atan2(this.y - point.y, ahead) >= diveBomber.shallowest
    if (aimable) this.aim = { x: point.x, y: point.y }
    return aimable
  }

  /** Flies on along its pitch at `speed`. */
  steer(speed) {
    this.vx = this.forward * speed * Math.cos(this.pitch)
    this.vy = speed * Math.sin(this.pitch)
  }

  /** Turns the nose towards `pitch` as fast as it can and flies on along it, the faster the steeper it dives. */
  pitchTowards(pitch, dt) {
    const step = diveBomber.pitchRate * dt
    this.pitch += Math.max(-step, Math.min(step, pitch - this.pitch))
    this.steer(speedAt(this.pitch))
  }

  /** How far ahead a bomb let go now, flying at `pitch`, falls to the height of `point`. */
  bombReach(pitch, point) {
    const speed = speedAt(pitch), { pull } = this.bomb
    const down = speed * Math.sin(pitch), height = Math.max(0, this.y - point.y)
    return speed * Math.cos(pitch) * (down + Math.sqrt(down ** 2 + 2 * pull * height)) / pull
  }

  /** The pitch at which a bomb let go would fall on `point`: level if even then it falls short, at most straight down. */
  bombingPitch(point) {
    const ahead = this.forward * (point.x - this.x)
    let level = 0, steep = -Math.PI / 2
    if (this.bombReach(level, point) <= ahead) return level
    for (let i = 0; i < 20; i++) {
      const middle = (level + steep) / 2
      if (this.bombReach(middle, point) > ahead) level = middle
      else steep = middle
    }
    return steep
  }

  /** It climbs or sinks back to its height, no faster than it flies, and flies level there. */
  cruise(dt) {
    const rate = Math.min(diveBomber.climb, diveBomber.speed)
    const climb = Math.max(-rate, Math.min(rate, (this.cruiseY - this.y) * 2))
    this.pitchTowards(Math.asin(climb / diveBomber.speed), dt)
  }

  /** How far at most it sinks while it pulls out of its dive to level, turning at its rate along an arc. */
  get pullOutDrop() {
    return diveBomber.diveSpeed / diveBomber.pitchRate * (1 - Math.cos(this.pitch))
  }

  /**
   * It dives as steep as its bomb needs to fall on the aimed point and lets it go as soon as it would; at the latest
   * so that pulling out it stays at least three quarters of its release height above the point.
   */
  dive(dt) {
    const { aim } = this
    this.pitchTowards(this.bombingPitch(aim), dt)
    const onTarget = Math.abs(this.bombReach(this.pitch, aim) - this.forward * (aim.x - this.x)) <= diveBomber.spread
    if (onTarget || this.y <= aim.y + diveBomber.releaseHeight * .75 + this.pullOutDrop) this.release()
  }

  /** The bomb leaves with its own velocity; that of a pass before, still falling, is not taken back. */
  release() {
    this.loaded = false
    this.setState('move')
    if (!this.canFire() || this.bomb.active) return
    this.bomb.release({ x: this.x, y: this.y, z: this.z }, this)
    this.shotsFired++
  }

  /** A shot down Ju 87 keeps flying on as it falls. */
  update(dt) {
    if (this.dead) fall(this, dt)
    super.update(dt)
    this.bomb.update(dt)
  }
}
