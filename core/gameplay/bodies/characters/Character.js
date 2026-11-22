import Body from '../Body.js'
import { damageAt } from '../../damage.js'
import { earthGravity } from '../../gravity.js'
import { rayBoxEntry } from '../../../collision/ray.js'

/**
 * Measured from the earlier 3D actors. `speed` is metres a second at a walk, `run` its multiple at a run and `back`
 * the share of that run going backwards; `keep` is the share of speed kept each second once it stops pushing. It
 * turns `turn` radians a second running and a quarter of that for each metre a second of its walk otherwise.
 * It falls `fall` times its world's gravity; `lift`, the push of a flying jump, is metres a second squared, `fallSpeed` the fastest it falls or
 * rises, and `climb` how fast it follows the ground up or down, in metres a second. It is airborne once its feet
 * are `airborne` of its height above the ground. A blow reaches `reach` metres the way it aims from `strikeHeight`
 * of its height and deals `damage`; a swing with no measured length lasts `swing` seconds and lands halfway through.
 */
export const character = {
  speed: 2, run: 2, back: .75, keep: .5 ** 30, turn: Math.PI / 2,
  fall: 42 / earthGravity, lift: 42 * 1.66, fallSpeed: 14, climb: 2, airborne: .25,
  reach: 1.5, strikeHeight: .66, damage: [35, 55], swing: .3,
}

/** The kinds of attack that deal a blow; another kind, as `special`, is only shown. */
const blows = ['attack', 'attack2']

const states = {
  idle: {},
  move: {},
  attack: {
    enter: body => {
      body.pendingBlow = null
    },
    update: (body, dt) => body.swingOn(dt),
    exit: body => {
      body.swing = null
    },
  },
  dead: {
    enter: body => {
      body.vx = body.vz = 0
      body.swing = body.pendingBlow = null
    },
  },
}

/**
 * A person, beast or monster on foot. `x, y, z` is the middle of its hit box, so its feet are half its height lower.
 * It walks, runs, turns and side-steps as it is steered, and looks up and down within `pitchRange`; it jumps, either
 * in one leap of `actions.jump` seconds or, flying, pushing itself up by `lift` for at most `maxLift` seconds. It swings
 * `attack`, `attack2` or `special` for their seconds in `actions` and, halfway through a blow, hits the nearest of the
 * living `targets` straight ahead within its reach, unless something nearer stands in the way. A blow of one of the
 * `area.kinds`, as a spell, hits every one of them within `area.reach` around it instead, with `area.damage`. It does
 * not walk into its targets, unless one is not `solid`, as a ghost. A hit that does not kill hurts it for
 * `actions.pain` seconds; a `guarded` one cannot be hurt while it attacks. One that `walks` not, as a gun on its
 * carriage, only turns; a bird or an airship keeps `altitude` metres above the ground or, in level flight, sea level.
 *
 * The scene answers its questions about the world: `groundAt(x, z, y)` is the height of the ground under height `y`,
 * so what floats over its head is not its ground, `isBlocked(from,
 * direction, distance)` whether it can step that way and `obstacleAt(from, direction, reach)` how far a blow goes
 * before something other than a target stops it. `bounds` keep its feet in `{ min: { x, z }, max: { x, z } }`.
 */
export default class Character extends Body {
  constructor({
    speed = character.speed, run = character.run, reach = character.reach, damage = character.damage,
    jumping = 'leap', maxLift = .28, turnWhileAttack = true, strikeHeight = character.strikeHeight, strikeAhead = 0, area = {}, solid = true,
    guarded = false, walks = true, altitude = 0, levelFlight = false, lift = character.lift, aimable = false,
    pitchRange = { min: -Math.PI / 10, max: Math.PI / 8 }, actions = { attack: character.swing }, targets = [],
    groundAt: ground = () => 0, isBlocked = () => false, resolveWallStep = null, obstacleAt = () => Infinity, bounds = null, random = Math.random,
    size = { length: .5, height: 1.8, width: .5 }, ...rest
  } = {}) {
    super({ size, ...rest, states })
    Object.assign(this, { speed, run, reach, damage, jumping, maxLift, turnWhileAttack, strikeHeight, strikeAhead, solid, guarded, walks, lift, pitchRange,
      actions, targets,
      isBlocked, resolveWallStep, obstacleAt, bounds, random })
    this.groundAt = ground
    this.altitude = altitude
    this.levelFlight = levelFlight
    this.area = { kinds: [], reach: 3, damage: [89, 135], ...area }
    this.steering = { ahead: 0, side: 0, turn: 0, running: false }
    this.aimable = aimable
    this.aiming = false
    /** The attack under way: its kind, seconds into it and whether its blow has landed. */
    this.swing = null
    /** An interrupted swing whose blow still waits for its original midpoint. */
    this.pendingBlow = null
    /** Seconds it still reels from a hit. */
    this.hurt = 0
    /** Seconds left of a leap, and seconds it has pushed itself up in this flying jump. */
    this.leap = 0
    this.lifted = 0
    /** Whether it could not step the way it was steered this frame. */
    this.blocked = false
    /** The last blow: where it started and ended, and the body it hit, if any. */
    this.strike = null
    this.y = this.supportHeight + size.height / 2
  }

  get feet() {
    return this.y - this.size.height / 2
  }

  get supportHeight() {
    if (this.alive && this.levelFlight) return this.altitude
    return this.groundAt(this.x, this.z, this.y) + (this.alive ? this.altitude : 0)
  }

  get states() {
    return this.actions.attack ? super.states : super.states.filter(name => name !== 'attack')
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    if (name === 'attack') return this.attack()
    super.setState(name)
  }

  /** Its feet are well above the ground, or it is leaping, rising or falling. */
  get airborne() {
    return this.leap > 0 || this.vy !== 0 || this.feet - this.supportHeight > this.size.height * character.airborne
  }

  get running() {
    return this.steering.running
  }

  /** The way it faces, along the ground. */
  get heading() {
    return { x: Math.cos(this.yaw), y: 0, z: -Math.sin(this.yaw) }
  }

  /**
   * Walks or runs `ahead` (1 forwards, -1 backwards), steps `side` (1 to its right) and turns `turn` (1 to its
   * left) until steered again; steered to move, it starts moving, and steered still, it stops.
   */
  steer({ ahead = 0, side = 0, turn = 0, running = false } = {}) {
    Object.assign(this.steering, { ahead, side, turn, running })
    const moving = ahead !== 0 || side !== 0
    if (moving && this.state === 'idle') this.setState('move')
    if (!moving && this.state === 'move') this.setState('idle')
  }

  /** Turns at once to face `point` along the ground. */
  face({ x, z }) {
    if (this.alive && (x !== this.x || z !== this.z)) this.yaw = Math.atan2(this.z - z, x - this.x)
  }

  /** Turns by `yaw` and looks up by `pitch`, both in radians, as far as it can look up or down. */
  look(yaw, pitch = 0) {
    if (this.dead || this.hurt > 0) return
    this.yaw += yaw
    this.pitch = Math.min(this.pitchRange.max, Math.max(this.pitchRange.min, this.pitch + pitch))
  }

  /** Where its blows start: at its strike height, which for one that aims with its eyes is their height. */
  get eye() {
    return this.ahead(this.strikeAhead, this.size.height * (this.strikeHeight - .5))
  }

  /** The way it aims: where it faces, raised by its pitch. */
  get aim() {
    const level = Math.cos(this.pitch)
    return { x: Math.cos(this.yaw) * level, y: Math.sin(this.pitch), z: -Math.sin(this.yaw) * level }
  }

  /** Starts a leap from the ground, or, flying, pushes itself up a little more; call it while jump is held. */
  jump(dt = 0) {
    if (this.dead || this.hurt > 0) return
    if (this.jumping === 'leap') {
      if (!this.airborne && this.actions.jump) this.leap = this.actions.jump
      return
    }
    if (!this.airborne) this.lifted = 0
    if (this.lifted >= this.maxLift) return
    this.lifted += dt
    this.vy = Math.min(character.fallSpeed, this.vy + this.lift * dt)
  }

  /** Swings `kind` unless it is already swinging, reeling or dead. */
  attack(kind = 'attack') {
    if (this.dead || this.hurt > 0 || this.swing || !this.acts.includes(kind) || kind === 'jump' || kind === 'aim') return
    this.swing = this.newSwing(kind)
    super.setState('attack')
  }

  newSwing(kind) {
    const lands = blows.includes(kind) || this.area.kinds.includes(kind)
    return { kind, time: 0, length: this.actions[kind] ?? character.swing, landed: !lands }
  }

  /** What it can be asked to do once: its kinds of attack and its jump, the ones it has a length for. */
  get acts() {
    const names = Object.keys(this.actions).filter(name => name !== 'pain')
    if (this.aimable) names.unshift('aim')
    if (this.jumping === 'fly' && !names.includes('jump')) names.push('jump')
    return names
  }

  /** One of its `acts` by name, as a story's button asks for it. */
  act(name) {
    if (name === 'aim' && this.aimable && this.alive) this.aiming = !this.aiming
    else if (name === 'jump') this.jump(this.maxLift)
    else this.attack(name)
  }

  takeHit(damage) {
    if (this.guarded && this.state === 'attack') return false
    const killed = super.takeHit(damage)
    if (!killed && this.alive) {
      this.hurt = this.actions.pain ?? 0
      // Pain interrupts the pose, but not the timing of the blow already under way.
      if (this.swing?.landed === false) this.pendingBlow = this.swing
      this.swing = null
      if (this.state === 'attack') this.setState(this.moving ? 'move' : 'idle')
    }
    return killed
  }

  get moving() {
    return this.steering.ahead !== 0 || this.steering.side !== 0
  }

  swingOn(dt) {
    const { swing } = this
    if (!swing) return this.setState(this.moving ? 'move' : 'idle')
    swing.time += dt
    if (!swing.landed && swing.time >= swing.length / 2) this.land()
    if (swing.time >= swing.length) {
      this.swing = null
      this.setState(this.moving ? 'move' : 'idle')
    }
  }

  /** The blow lands on the nearest living target ahead within reach, unless something nearer is in the way. */
  land(swing = this.swing) {
    swing.landed = true
    this.shotsFired++
    if (this.area.kinds.includes(swing.kind)) return this.landAround()
    const from = this.eye
    const direction = this.aim
    let target = null, distance = this.obstacleAt(from, direction, this.reach)
    for (const body of this.targets) {
      if (body === this || body.dead) continue
      const entry = rayBoxEntry(from, direction, body)
      if (entry !== null && entry <= this.reach && entry < distance) {
        target = body
        distance = entry
      }
    }
    const length = Math.min(distance, this.reach)
    this.strike = { from, to: { x: from.x + direction.x * length, y: from.y + direction.y * length,
      z: from.z + direction.z * length }, target }
    target?.takeHit(damageAt({ distance, reach: this.reach, range: this.damage, roll: this.roll }))
  }

  /** The blow lands on every living target within the reach of its area blow around it. */
  landAround() {
    const from = this.eye, { reach, damage } = this.area
    this.strike = { from, to: from, target: null }
    for (const body of this.targets) {
      if (body === this || body.dead) continue
      const distance = Math.hypot(body.x - this.x, body.z - this.z)
      if (distance <= reach) body.takeHit(damageAt({ distance, reach, range: damage, roll: this.roll }))
    }
  }

  /** A whole number from `low` to `high`, both included. */
  roll = (low, high) => low + Math.floor(this.random() * (high - low + 1))

  /** The velocity it is steered to along the ground, in metres a second. */
  get steered() {
    if (this.state !== 'move' || !this.walks) return { x: 0, z: 0 }
    const { ahead, side, running } = this.steering
    // moving with no way given, as a story sets it, it walks ahead
    const forward = !ahead && !side ? 1 : ahead
    const pace = this.speed * (running ? this.run : 1)
    const along = forward > 0 ? forward * pace : forward * (running ? pace * character.back : this.speed)
    const across = side * pace
    const { x, z } = this.heading
    return { x: x * along - z * across, z: z * along + x * across }
  }

  /** Radians a second it turns, running or not. */
  turnRate(running = this.running) {
    return running ? character.turn : character.turn * this.speed * .25
  }

  steerTurn(dt) {
    const { turn } = this.steering
    if (!turn || this.dead || this.hurt > 0) return
    if (this.state === 'attack' && !this.turnWhileAttack) return
    this.yaw += turn * this.turnRate() * dt
  }

  update(dt) {
    this.hurt = Math.max(0, this.hurt - dt)
    this.leap = Math.max(0, this.leap - dt)
    this.steerTurn(dt)
    const free = this.alive && this.hurt === 0
    const target = free ? this.steered : { x: 0, z: 0 }
    const kept = character.keep ** dt
    this.vx = target.x + (this.vx - target.x) * kept
    this.vz = target.z + (this.vz - target.z) * kept
    this.keepClear(dt)
    const flying = this.airborne
    if (flying) this.vy = Math.max(-character.fallSpeed, this.vy - this.gravity * character.fall * dt)
    if (this.alive && this.pendingBlow) {
      const blow = this.pendingBlow
      blow.time += dt
      if (blow.time >= blow.length / 2) {
        this.pendingBlow = null
        this.land(blow)
      }
    }
    const previousX = this.x, previousZ = this.z
    super.update(dt)
    if (this.resolveWallStep) {
      const position = this.resolveWallStep(this, previousX, previousZ)
      this.blocked ||= Math.hypot(position.x - this.x, position.z - this.z) > 1e-6
      this.x = position.x
      this.z = position.z
    }
    this.keepInBounds()
    this.followGround(dt, flying)
  }

  /** It does not step into what blocks its way. */
  keepClear(dt) {
    const speed = Math.hypot(this.vx, this.vz)
    this.blocked = false
    if (speed * dt < 1e-6) return
    const direction = { x: this.vx / speed, y: 0, z: this.vz / speed }
    const from = { x: this.x, y: this.y, z: this.z }
    // one it already touches holds it only on the way towards it, so the two can part
    const ahead = body => (body.x - this.x) * direction.x + (body.z - this.z) * direction.z > 0
    const inTheWay = body => body !== this && body.alive && body.solid !== false && ahead(body) &&
      (rayBoxEntry(from, direction, body) ?? Infinity) < this.size.length
    if (!this.isBlocked(from, direction, Math.max(this.size.length, speed * dt)) && !this.targets.some(inTheWay)) return
    this.blocked = true
    this.vx = this.vz = 0
  }

  keepInBounds() {
    if (!this.bounds) return
    const { min, max } = this.bounds
    const x = Math.min(max.x, Math.max(min.x, this.x)), z = Math.min(max.z, Math.max(min.z, this.z))
    if (x !== this.x || z !== this.z) this.blocked = true
    Object.assign(this, { x, z })
  }

  /** Flying, it lands once it comes down to the ground; walking, it follows the ground at its climbing speed. */
  followGround(dt, flying) {
    const ground = this.supportHeight
    if (flying) {
      if (this.feet > ground || this.vy > 0) return
      this.y = ground + this.size.height / 2
      this.vy = 0
      return
    }
    const step = character.climb * dt, difference = ground - this.feet
    this.y += Math.abs(difference) <= step ? difference : Math.sign(difference) * step
  }
}
