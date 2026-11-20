import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import Bomb from '/core/actor/projectiles/Bomb.js'
import Explosion from '/core/actor/effects/Explosion.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { outsideView } from '/core/actor/worldView.js'

/**
 * A Ju 87: its level speed, faster than the plane takes off, and its speed straight down, in pixels per second; how
 * fast it climbs back to its height after a dive; how fast its nose turns, in radians a second; the shallowest dive
 * it takes, in radians below level; how far it sees a target to dive on and how high above the point it aims at it
 * lets its bomb go, in pixels; its own health in bullet damage, more than a fighter's.
 */
export const diveBomber = {
  speed: 360, diveSpeed: 520, climb: 150, pitchRate: 2.2, shallowest: .6, range: 650, releaseHeight: 300, health: 60,
}
/**
 * A shot down Ju 87 keeps its speed and gravity bends its path down: the pull in pixels per second squared, and the
 * share of its forward speed the dead engine loses each second, so the dive steepens as it falls.
 */
export const wreckFall = { gravity: 600, drag: .5 }
/** The 200 × 74 px picture, nose to the left, drawn a quarter larger than the Bf 109, as the real plane is. */
const art = { src: 'armies/game-ready/avioni/ju87.svg', width: 250, height: 250 * 74 / 200 }
/** A burst is drawn this far above where it hits the ground, so the fire stands on it. */
const burstLift = 64
/** A Ju 87 this far past the view has gone, in pixels. */
const gone = 600

/**
 * A Ju 87 flies level at its height; set to fire, it dives on the point it aims at, lets its one bomb go above it,
 * pulls up and climbs back; shot down, it falls. Who sets it to fire, and when, is up to the world.
 */
const states = {
  idle: {
    update: (bomber, dt) => bomber.cruise(dt),
  },
  fire: {
    update: (bomber, dt) => {
      if (bomber.loaded && bomber.aim) bomber.dive(dt)
      else bomber.cruise(dt)
    },
  },
  dead: {
    enter: bomber => {
      if (bomber.alive) bomber.die()
    },
    update: (bomber, dt) => bomber.fall(dt),
  },
}

/**
 * A Ju 87 dive bomber in world coordinates that comes head on or from behind, carries one bomb a pass and drops it
 * where it aims. It does not know what its bomb hits.
 */
export default class DiveBomber extends GameObject2D {
  /**
   * `groundAt(x)` gives the height of what stands under `x`; `onImpact(point)` destroys what its bomb's burst
   * reaches, and `onCrash(point)` what its falling wreck hits.
   */
  constructor({ camera, groundY, groundAt = () => groundY, session, onImpact, onCrash }) {
    super(art.src, { width: art.width, height: art.height, flammable: true, visible: false })
    this.tags.add('neprijatelj')
    this.camera = camera
    this.groundY = groundY
    this.session = session
    this.onImpact = onImpact
    this.onCrash = onCrash
    this.health = diveBomber.health
    /** Radians below level the path points, along the way it flies. */
    this.pitch = 0
    this.loaded = false
    this.aim = null
    this.bomb = new Bomb({ camera, groundAt, onImpact: bomb => this.burstBomb(bomb) })
    this.bombBurst = new Explosion(camera)
    this.burst = new Explosion(camera)
    this.children.push(this.bomb, this.bombBurst, this.burst)
    this.machine = new StateMachine(this, states, 'idle')
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

  get offScreen() {
    return outsideView(this, this.camera)
  }

  /** Head on it flies left; from behind, right. It holds the height `y` it comes at, with a new bomb. */
  enter({ x, y, fromBehind }) {
    this.fromBehind = fromBehind
    this.cruiseY = y
    this.pitch = 0
    this.loaded = true
    this.aim = null
    this.setPosition(x, y)
    this.steer(diveBomber.speed)
    // the renderer mirrors left to right by `flipY`
    this.flipY = fromBehind ? -1 : 1
    this.show()
  }

  /** It dives only down ahead of its nose, at least as steep as its shallowest dive. */
  get shots() {
    return { down: { x: 300, y: 300 } }
  }

  /** The way the Ju 87 flies: 1 right, -1 left. */
  get forward() {
    return this.fromBehind ? 1 : -1
  }

  get heading() {
    return this.fromBehind ? 0 : Math.PI
  }

  get reach() {
    return diveBomber.range
  }

  /** It can dive on a point ahead of it and below, at least as steep as its shallowest dive; it aims there. */
  aimAt(point) {
    const ahead = this.forward * (point.x - this.x)
    const aimable = ahead > 0 && Math.atan2(point.y - this.y, ahead) >= diveBomber.shallowest
    if (aimable) this.aim = { x: point.x, y: point.y }
    return aimable
  }

  takeHit(damage) {
    if (this.dead) return
    this.health -= damage
    if (this.health <= 0) this.die()
  }

  /** A shot down Ju 87 does not stop in the air: it keeps flying on as it starts to fall. */
  die() {
    if (this.dead) return
    const { dx, dy } = this
    super.die()
    this.dx = dx
    this.dy = dy
    this.machine.set('dead')
  }

  /** Turns the nose towards `pitch` as fast as it can and flies on along it, the faster the steeper it dives. */
  pitchTowards(pitch, dt) {
    const step = diveBomber.pitchRate * dt
    this.pitch += Math.max(-step, Math.min(step, pitch - this.pitch))
    const steepness = Math.max(0, Math.sin(this.pitch))
    this.steer(diveBomber.speed + (diveBomber.diveSpeed - diveBomber.speed) * steepness)
  }

  steer(speed) {
    this.dx = this.forward * speed * Math.cos(this.pitch)
    this.dy = speed * Math.sin(this.pitch)
    // the picture's nose points along `heading` before it is turned
    this.angle = Math.atan2(this.dy, this.dx) - this.heading
  }

  /** It climbs or sinks back to its height, no faster than it flies, and flies level there. */
  cruise(dt) {
    const rate = Math.min(diveBomber.climb, diveBomber.speed)
    const sink = Math.max(-rate, Math.min(rate, (this.cruiseY - this.y) * 2))
    this.pitchTowards(Math.asin(sink / diveBomber.speed), dt)
  }

  /** It dives with its nose on the aimed point and lets the bomb go with its own speed once low enough above it. */
  dive(dt) {
    const { aim } = this
    this.pitchTowards(Math.atan2(aim.y - this.y, Math.max(1, this.forward * (aim.x - this.x))), dt)
    if (this.y >= aim.y - diveBomber.releaseHeight) this.release()
  }

  /** The bomb of a pass before, still falling, is not taken back. */
  release() {
    this.loaded = false
    if (this.session.state !== 'running' || this.bomb.visible) return
    this.bomb.release(this.position, this)
  }

  burstBomb({ x, y }) {
    this.bombBurst.start(x, y - burstLift)
    this.onImpact?.({ x, y })
  }

  /**
   * A shot down Ju 87 falls burning with its nose along its path, blows up on the ground and destroys what stands
   * around it.
   */
  fall(dt) {
    this.dx *= Math.exp(-wreckFall.drag * dt)
    this.dy += wreckFall.gravity * dt
    this.angle = Math.atan2(this.dy, this.dx) - this.heading
    if (this.y < this.groundY) return
    this.burst.start(this.x, this.groundY - burstLift)
    this.hide()
    this.onCrash?.({ x: this.x, y: this.groundY })
  }

  update(dt, t) {
    if (!this.visible) return
    this.machine.update(dt)
    // a wreck that has just hit the ground stays where it hit
    if (!this.visible) return
    super.update(dt, t)
    if (this.alive && this.hasGone) this.hide()
  }

  /**
   * It has gone once it is far past the left of the view: head on it has passed, from behind it has dropped behind the
   * faster view; from behind also once it is far past the right. Head on it may come from farther away on the right.
   */
  get hasGone() {
    const screenX = this.x - this.camera.cameraX
    return screenX < -gone || this.fromBehind && screenX > canvas2d.width + gone
  }
}
