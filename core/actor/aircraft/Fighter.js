import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Bullet, { inheritVelocity } from '/core/actor/projectiles/Bullet.js'
import Explosion from '/core/actor/effects/Explosion.js'
import WorldPart from '/core/actor/WorldPart.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { outsideView, turn } from '/core/actor/worldView.js'

/**
 * An enemy fighter: its speed head on and its lead when it comes from behind, in pixels per second; how fast it
 * follows the plane's height; how far and how far off its heading it fires, in pixels and radians; seconds between
 * shots; how much of the plane's health one of its bullets takes, so a whole pass from behind takes about half; its
 * own health in bullet damage; how far above or below the plane it passes, in pixels: more than half their heights
 * together, so it does not ram the plane, and near enough that its fire on the way in can still hit.
 */
export const fighter = {
  speed: 450, overtake: 150, climb: 180, range: 700, cone: .25, reload: .15, damage: 5, health: 40, passOffset: 120,
}
/**
 * A shot down fighter keeps its speed and gravity bends its path down: the pull in pixels per second squared, and
 * the share of its forward speed the dead engine loses each second, so the dive steepens as it falls.
 */
export const wreckFall = { gravity: 600, drag: .5 }
/** It passes below only with this much room left above the ground, in pixels. */
const groundClearance = 100
/**
 * The fighter is drawn as a plane and its two blades, which spin by squeezing towards the hub and back. Measured on
 * the 404 × 132 px picture: the hub's offset from the picture's middle. `spin` is in turns a second, as seen; once the engine is dead the
 * blades slow down each second by `stall` of their turning and windmill on at `windmill`.
 */
const propeller = { hub: { x: -182, y: -1 }, spin: 5, stall: 1.5, windmill: .7 }
const scale = .52
/** A fighter this far past the view has gone for good, in pixels. */
const gone = 600

/**
 * A fighter flies its pass; set to fire, it also fires straight ahead of its nose as often as its guns reload; shot
 * down, it falls. Who sets it to fire, and when, is up to the world.
 */
const states = {
  idle: {
    update: fighter => fighter.fly(),
  },
  fire: {
    update: fighter => {
      fighter.fly()
      if (fighter.session.state === 'running') fighter.weapon.tryFire(fighter.position, fighter.heading)
    },
  },
  dead: {
    enter: fighter => {
      if (fighter.alive) fighter.die()
    },
    update: (fighter, dt) => fighter.fall(dt),
  },
}

/**
 * A Bf 109 that comes once, head on or from behind, passes just above or below the plane, fires at it while it is
 * ahead of its nose and flies on.
 */
export default class Fighter extends GameObject2D {
  /**
   * `onCrash(point)` destroys what the falling wreck hits on the ground.
   */
  constructor({ plane, camera, groundY, session, onCrash }) {
    // the picture shows the nose to the left
    super('armies/game-ready/avioni/bf109-telo.png', { scale, flammable: true, visible: false })
    this.tags.add('neprijatelj')
    this.plane = plane
    this.camera = camera
    this.groundY = groundY
    this.session = session
    this.onCrash = onCrash
    this.health = fighter.health
    this.bullets = new ProjectilePool({ owner: this, create: () => new Bullet(camera, { damage: fighter.damage }), onFire: inheritVelocity(this) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: fighter.reload, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 1000),
    })
    this.burst = new Explosion(camera)
    this.propeller = new WorldPart('armies/game-ready/avioni/bf109-propeler.png', { camera: this.camera, scale, visible: false })
    this.propellerTurn = 0
    this.propellerSpin = propeller.spin
    this.children.push(this.propeller, this.burst)
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

  /** Head on it flies left against the plane; from behind it flies right and slowly overtakes it. */
  enter({ x, y, fromBehind }) {
    this.fromBehind = fromBehind
    const roomBelow = y + fighter.passOffset < this.groundY - groundClearance
    this.passSide = roomBelow && Math.random() < .5 ? 1 : -1
    this.setPosition(x, y)
    // the renderer mirrors left to right by `flipY`
    this.flipY = this.propeller.flipY = fromBehind ? -1 : 1
    this.show()
    this.propeller.show()
  }

  /**
   * The fighter fires only straight ahead of its nose. For that a plane is far enough ahead to be within the cone of
   * fire, on the other side of the fighter's pass, so that the fighter keeps its height.
   */
  get shots() {
    return { straight: { x: 600, y: -this.passSide * fighter.passOffset } }
  }

  /** The way the fighter flies: 1 right, -1 left. */
  get forward() {
    return Math.sign(Math.cos(this.heading))
  }

  get heading() {
    return this.fromBehind ? 0 : Math.PI
  }

  takeHit(damage) {
    if (this.dead) return
    this.health -= damage
    if (this.health <= 0) this.die()
  }

  /** A shot down fighter does not stop in the air: it keeps flying on as it starts to fall. */
  die() {
    if (this.dead) return
    const { dx, dy } = this
    super.die()
    this.dx = dx
    this.dy = dy
    this.machine.set('dead')
  }

  /** Whether the plane is in reach and ahead of the fighter's nose. */
  get reach() {
    return fighter.range
  }

  /** The guns fire only straight ahead, so the fighter can aim only at a point within its cone of fire. */
  aimAt(point) {
    return Math.abs(turn(this.heading, this.angleTo(point))) <= fighter.cone
  }

  fly() {
    const { plane } = this
    this.dx = this.fromBehind ? Math.max(plane.dx, 0) + fighter.overtake : -fighter.speed
    const passY = plane.y + this.passSide * fighter.passOffset
    const climb = Math.max(-fighter.climb, Math.min(fighter.climb, (passY - this.y) * 2))
    this.dy = plane.dead ? 0 : climb
  }

  /**
   * A shot down fighter falls burning with its nose along its path, blows up on the ground and destroys what stands
   * around it.
   */
  fall(dt) {
    this.dx *= Math.exp(-wreckFall.drag * dt)
    this.dy += wreckFall.gravity * dt
    // the picture's nose points along `heading` before it is turned
    this.angle = Math.atan2(this.dy, this.dx) - this.heading
    if (this.y < this.groundY) return
    this.burst.start(this.x, this.groundY - 64)
    this.hide()
    this.onCrash?.({ x: this.x, y: this.groundY })
  }

  /**
   * The blades turn fast while the engine runs and only windmill once it is dead. The hub is mirrored and turned
   * with the plane, as the renderer turns the picture before mirroring it.
   */
  spinPropeller(dt) {
    if (this.dead)
      this.propellerSpin = Math.max(propeller.windmill, this.propellerSpin * Math.exp(-propeller.stall * dt))
    this.propellerTurn = (this.propellerTurn + this.propellerSpin * dt) % 1
    this.propeller.scaleY = Math.cos(this.propellerTurn * 2 * Math.PI)
    const hubX = propeller.hub.x * scale * this.flipY
    const hubY = propeller.hub.y * scale
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    this.propeller.setPosition(this.x + hubX * cos - hubY * sin, this.y + hubX * sin + hubY * cos)
    this.propeller.angle = this.angle
    this.propeller.visible = this.visible
  }

  update(dt, t) {
    if (!this.visible) return this.propeller.hide()
    this.machine.update(dt)
    super.update(dt, t)
    if (this.session.state === 'running') this.bullets.checkHits([this.plane])
    if (this.alive && this.hasGone) this.hide()
    this.spinPropeller(dt)
  }

  /** Head on it leaves past the left of the view; from behind, past the right. */
  get hasGone() {
    const screenX = this.x - this.camera.cameraX
    return this.fromBehind ? screenX > canvas2d.width + gone : screenX < -gone
  }
}
