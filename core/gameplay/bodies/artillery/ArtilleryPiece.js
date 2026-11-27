import Body from '../Body.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Cannonball from '../projectiles/Cannonball.js'
import { placeShape } from '../../../collision/shapes.js'
import { sweepCircle } from '../../../collision/sweep.js'

/** The elevations `aimAt` tries, from the highest down. */
const aimStep = .005

/**
 * The piece stands, its crew loads it, or it fires where `aimAt` set it as soon as its last shot is over, or it lies
 * destroyed. Who aims and fires it, and when, is up to the world.
 */
const states = {
  idle: {},
  load: { update: (piece, dt) => piece.charge(dt) },
  attack: {
    update: piece => {
      if (piece.hasActiveShot || piece.aimedForce === null) return
      piece.force = piece.aimedForce
      piece.launch()
    },
  },
  dead: {},
}

/**
 * A gun that throws one shot at a time along its barrel, facing right (yaw 0) or left (yaw π). Its `settings` give
 * the force of a shot, at least and at most, in metres a second, and how much holding fire adds to it each second;
 * how fast the barrel rises and sinks, in radians a second, and how far; under what health it burns; and how many
 * times the world's gravity pulls its shots down (`shellFall`). Its shots fly with the `wind`, hit the living ones of
 * `targets`, burst on the ground, where `onBlast(x)` digs a crater, and leave play past the sides of `bounds`. It
 * fires only while `canFire()`. A piece gives its own `muzzle`, and its `parts`: the shapes drawn on it that take the
 * hits, each with the place, turn and mirroring it is drawn with.
 */
export default class ArtilleryPiece extends Body {
  constructor({ settings, targets = [], wind = null, groundAt = () => 0, bounds, onBlast, canFire = () => true,
    random = Math.random, ...rest }) {
    super({ ...rest, states })
    Object.assign(this, { settings, targets, wind, groundAt, canFire })
    this.elevation = settings.lowest
    this.force = settings.minForce
    this.aimedForce = null
    this.shells = new ProjectilePool(() => new Cannonball({ gravity: this.gravity, fall: settings.shellFall, wind,
      groundAt, bounds, onBlast, random }))
  }

  /** The way it faces: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return
    super.setState(name)
  }

  get elevation() {
    return this.barrelElevation
  }

  /** The barrel's angle above level, kept between the lowest and the highest it goes. */
  set elevation(value) {
    const { lowest, highest } = this.settings
    this.barrelElevation = Math.max(lowest, Math.min(highest, value))
  }

  /** The barrel's angle from +x. */
  get barrelAngle() {
    return this.forward > 0 ? this.elevation : Math.PI - this.elevation
  }

  get burning() {
    return this.health.current <= this.settings.burnBelow
  }

  get hasActiveShot() {
    return this.shells.projectiles.some(shell => shell.active)
  }

  /** When the step of a round shot of `radius` from `start` to `end` first touches the drawn piece, or null. */
  hitTime(start, end, radius = 0) {
    let first = null
    for (const part of this.parts)
      for (const shape of part.shapes) {
        const time = sweepCircle(start, end, radius, placeShape(shape, part))
        if (time !== null && (first === null || time < first)) first = time
      }
    return first
  }

  /** Fires the charged force along the barrel if it may and its last shot is over; returns whether. */
  launch() {
    if (this.dead || !this.canFire() || this.hasActiveShot) return false
    this.shells.fire(this.muzzle, this.forward > 0 ? 0 : Math.PI, this.elevation, this.force)
    this.shotsFired++
    this.force = this.settings.minForce
    return true
  }

  /** Builds up the force of the next shot while fire is held. */
  charge(dt) {
    const { maxForce, chargeRate } = this.settings
    this.force = Math.min(maxForce, this.force + chargeRate * dt)
  }

  /** Whether fire has been held, so letting it go fires. */
  get charged() {
    return this.force > this.settings.minForce
  }

  /** Raises the barrel for `way` 1, or lowers it for -1. */
  turnBarrel(way, dt) {
    this.elevation += way * this.settings.aimRate * dt
  }

  /** How hard its shots are pulled down. */
  get ballPull() {
    return this.gravity * this.settings.shellFall
  }

  /**
   * The force that throws a shot from the muzzle to `point` at `elevation`, which the barrel is set to, with the
   * wind, or null when no throw at it gets there.
   */
  forceFor(point, elevation = this.elevation) {
    const { x, y } = this.muzzle
    const distance = Math.abs(point.x - x)
    const drop = y - point.y
    const acceleration = this.forward * (this.wind?.acceleration || 0)
    const timeSquared = 2 * (distance * Math.tan(elevation) + drop) / (this.ballPull + acceleration * Math.tan(elevation))
    return timeSquared > 0
      ? (distance - acceleration * timeSquared / 2) / (Math.cos(elevation) * Math.sqrt(timeSquared))
      : null
  }

  /**
   * Sets the barrel and the force of the next shot for `point`, at the highest elevation whose force the piece has,
   * and gives whether the point is ahead and within reach. An unreachable point leaves the aim as it was.
   */
  aimAt(point) {
    if (Math.sign(point.x - this.x) !== this.forward) return false
    const { elevation } = this
    const { lowest, highest, minForce, maxForce } = this.settings
    const steps = Math.ceil((highest - lowest) / aimStep)
    for (let i = 0; i <= steps; i++) {
      this.elevation = Math.max(lowest, highest - i * aimStep)
      const force = this.forceFor(point)
      if (force !== null && force >= minForce && force <= maxForce) {
        this.aimedForce = force
        return true
      }
    }
    this.elevation = elevation
    return false
  }

  /** Its shots fly on. */
  update(dt) {
    super.update(dt)
    this.shells.update(dt, this.targets)
  }
}
