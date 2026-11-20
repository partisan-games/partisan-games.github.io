import Sound from '/core/io/audio/SoundSource.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import canvas2d from '/core/io/canvas2d.js'
import CombatTarget from './CombatTarget.js'
import EnemyFire from './EnemyFire.js'
import { createAircraftGun, createAirBomb } from './EnemyWeapons.js'
import { shellGravity } from '../tenkici/shellPhysics.js'
import AircraftPropellers from '/core/actor/aircraft/AircraftPropellers.js'

/**
 * The steepest dive and how fast the nose turns, in radians and radians a second; how fast a shot-down plane falls and
 * how fast its wreck slows to the scenery, in pixels a second squared.
 */
export const flight = { maxDive: Math.PI / 10, pitchRate: .35, fall: 180, wreckFriction: 120 }

const crash = {
  enter: plane => plane.die(),
  update: (plane, dt) => plane.crashed ? plane.slide(dt) : plane.fall(dt),
}

/** The fighter flies level, or dives as steep as it aims, holding fire or firing its nose guns, or crashes. */
const fighterStates = {
  fly: { update: (plane, dt) => plane.pitchTowards(0, dt) },
  dive: { update: (plane, dt) => plane.pitchTowards(plane.divePitch, dt) },
  fire: { update: (plane, dt) => plane.pitchTowards(plane.divePitch, dt) },
  crash,
}

/** The dive bomber flies level, or drops its one bomb on the point it aims at, as it passes over it, or crashes. */
const bomberStates = { fly: {}, fire: {}, crash }

/**
 * An enemy plane over the road; its shots hit the `target`. Who sets its state, and when, is up to the world: it may
 * give the plane a `controller`, which chooses the state each frame before the plane moves.
 */
export default class Aircraft extends CombatTarget {
  constructor({ kind, art, clock, target, groundY, crashY = () => groundY + 60, scrollSpeed = -160, callback }) {
    super({ ...art, x: canvas2d.width + 250, y: 100, z: -1, flammable: true, callback, visible: false })
    this.propellers = new AircraftPropellers(art.src)
    this.kind = kind
    this.airborne = true
    this.groundY = groundY
    this.clock = clock
    this.crashY = crashY
    this.scrollSpeed = scrollSpeed
    this.flightSpeed = Math.max(120, Math.min(320, canvas2d.width * .24)) * (kind === 'diveBomber' ? .8 : 1)
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position, getRevision: () => this.lifeId } })
    this.sounds.push(this.engineSound)
    this.active = false
    this.alive = false
    this.fire = new EnemyFire({ owner: this, target, clock, groundY,
      createWeapon: kind === 'diveBomber' ? createAirBomb : createAircraftGun,
      muzzle: () => this.muzzle,
    })
    this.projectiles = this.fire.projectiles
    this.controller = null
    this.divePitch = 0
    this.machine = new StateMachine(this, kind === 'diveBomber' ? bomberStates : fighterStates, 'fly')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** Flies left: the art is drawn so. */
  get forward() {
    return -1
  }

  /** The fighter's guns fire along its nose, level or diving; the bomber's bomb falls ahead of it onto the road. */
  get shots() {
    if (this.kind !== 'diveBomber') return { straight: { x: 300, y: 0 }, down: { x: 300, y: 300 * Math.tan(flight.maxDive) } }
    const drop = 200
    return { down: { x: this.flightSpeed * Math.sqrt(2 * drop / shellGravity), y: drop } }
  }

  /**
   * The fighter takes the dive that points its nose at `point`, as steep as it can; the bomber sights its bomb on it.
   * Either can fire only at a point ahead.
   */
  aimAt(point) {
    const ahead = this.x - point.x
    if (this.kind === 'diveBomber') this.fire.aimAt(point)
    else this.divePitch = Math.min(flight.maxDive, Math.atan2(Math.max(0, point.y - this.y), ahead))
    return ahead > 0
  }

  die(source) {
    super.die(source)
    this.setState('crash')
  }

  /** Turns the nose towards `pitch` as fast as it can, at the plane's own speed. */
  pitchTowards(pitch, dt) {
    const current = Math.atan2(this.dy, this.flightSpeed)
    const change = pitch - current
    const next = current + Math.sign(change) * Math.min(Math.abs(change), flight.pitchRate * dt)
    this.dy = this.flightSpeed * Math.tan(next)
    this.angle = Math.atan2(this.dy, this.dx) - Math.PI
  }

  fall(dt) {
    this.dy += flight.fall * dt
    this.angle = -Math.min(.55, Math.atan2(this.dy, Math.abs(this.dx)))
  }

  slide(dt) {
    const relativeSpeed = this.dx - this.scrollSpeed
    this.dx -= Math.sign(relativeSpeed) * Math.min(Math.abs(relativeSpeed), flight.wreckFriction * dt)
  }

  get muzzle() {
    const forward = this.kind === 'diveBomber' ? 0 : this.width * .4
    const angle = Math.atan2(this.dy, this.dx)
    return { x: this.x + Math.cos(angle) * forward, y: this.y + Math.sin(angle) * forward + this.height * .12 }
  }

  get muzzleAngle() {
    return Math.atan2(this.dy, this.dx)
  }

  launch() {
    this.reset()
    if (this.flame) this.flame.clear()
    this.setPosition(canvas2d.width + this.width / 2 + 20,
      this.groundY - Math.min(230, Math.max(120, canvas2d.height * .28)))
    this.dx = -this.flightSpeed
    this.dy = 0
    this.angle = 0
    this.active = true
    this.crashed = false
    this.wreckUntil = null
    this.setState('fly')
    this.divePitch = 0
    // the lowest it dives on this pass
    this.pullUpY = this.groundY - Math.min(130, (this.groundY - this.y) * .6)
    this.bombReleased = false
    this.show()
    this.fire.reset()
  }

  checkBounds() {
    if (this.dead && !this.crashed && this.y >= this.crashY(this)) {
      this.y = this.crashY(this)
      this.dy = 0
      this.angle = -.12
      this.crashed = true
      this.wreckUntil = this.clock.now + 6
    }
    if (this.x + this.width / 2 < 0 ||
      (!this.dead && this.y - this.height / 2 > this.groundY) ||
      (this.crashed && this.clock.now >= this.wreckUntil)) {
      this.active = false
      this.vanish()
    }
  }

  /** Whether a bomb let go now falls on the sighted point, while the plane flies on at its speed. */
  bombWindow(dt) {
    const { point } = this.fire
    if (this.bombReleased || !point || point.y <= this.muzzle.y) return false
    const fallTime = Math.sqrt(2 * (point.y - this.muzzle.y) / shellGravity)
    const impactX = this.muzzle.x - this.flightSpeed * fallTime
    return this.x > point.x && Math.abs(impactX - point.x) <= this.flightSpeed * dt + 12
  }

  update(dt) {
    this.propellers.update(dt, this.active && this.alive)
    this.engineSound.setPlaying(this.active && !this.dead)
    let firing = false
    if (this.active) {
      this.controller?.update(dt)
      this.machine.update(dt)
      super.update(dt)
      firing = this.state === 'fire' && (this.kind !== 'diveBomber' || this.bombWindow(dt))
    }
    const fired = this.fire.update(this.active && !this.dead && firing)
    if (fired && this.kind === 'diveBomber') this.bombReleased = true
  }

  checkHits() {
    this.fire.checkHits()
  }
}
