import Body from '../Body.js'
import Bomb from '../projectiles/Bomb.js'
import { fall } from './wreck.js'

/**
 * A Ju 87: its level speed, faster than a plane takes off, and its speed straight down, in metres a second; how fast
 * it climbs back to its height after a dive; how fast its nose turns, in radians a second; the shallowest dive it
 * takes, in radians below level; how far it sees a target to dive on and how high above the point it aims at it lets
 * its bomb go, in metres; its own health in bullet damage, more than a fighter's. Measured from the earlier pixel
 * Ju 87 at 30.8 px a metre.
 */
export const diveBomber = {
  speed: 11.69, diveSpeed: 16.89, climb: 4.87, pitchRate: 2.2, shallowest: .6, reach: 21.07, releaseHeight: 9.71, health: 60,
}

/**
 * A Ju 87 flies level at its height; set to fire, it dives on the point it aims at, lets its one bomb go above it,
 * pulls up and climbs back; shot down, it falls and crashes.
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
    const steepness = Math.max(0, -Math.sin(this.pitch))
    this.steer(diveBomber.speed + (diveBomber.diveSpeed - diveBomber.speed) * steepness)
  }

  /** It climbs or sinks back to its height, no faster than it flies, and flies level there. */
  cruise(dt) {
    const rate = Math.min(diveBomber.climb, diveBomber.speed)
    const climb = Math.max(-rate, Math.min(rate, (this.cruiseY - this.y) * 2))
    this.pitchTowards(Math.asin(climb / diveBomber.speed), dt)
  }

  /** It dives with its nose on the aimed point and lets the bomb go once low enough above it. */
  dive(dt) {
    const { aim } = this
    this.pitchTowards(Math.atan2(aim.y - this.y, Math.max(.05, this.forward * (aim.x - this.x))), dt)
    if (this.y <= aim.y + diveBomber.releaseHeight) this.release()
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
