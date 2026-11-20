import { icons } from '/core/io/icons.js'
import Sound from '/core/io/audio/SoundSource.js'
import Player2D from '/core/actor/Player2D.js'
import { frames } from '/core/constants.js'
import canvas2d from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { outsideView, turn } from '/core/actor/worldView.js'
import Bullet, { inheritVelocity } from '/core/actor/projectiles/Bullet.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Bomb from '/core/actor/projectiles/Bomb.js'
import { attackLabels } from '/core/io/keys.js'

const tiltRate = 0.01
const maxTilt = 0.066
const gravity = 3
/** A shot down plane falls faster than a flying one sinks, and tumbles nose over tail, in radians per second. */
const wreckGravity = gravity * 30
const tumbleRate = 2.5
/**
 * Airspeed in pixels per second: the speed at takeoff, the slowest and fastest flight, and the change per frame of
 * throttle. Full throttle adds 600 to the takeoff speed, as it did when the scenery scrolled.
 */
export const airspeed = { start: 312, min: 200, max: 912, throttle: 5 }
/**
 * The plane: its health, under half of which the damaged engine smokes; how high above the ground it can climb, in
 * pixels; rounds of the gun, about 20 seconds of fire; bombs per flight, chosen for play; seconds between two bombs,
 * so a quick tapping cannot drop the whole load on one spot; how close to a bomb's impact a target is destroyed.
 */
export const plane = { health: 100, ceiling: 5555, ammo: 200, bombs: 4, bombInterval: 1, blastRadius: 120 }
/** The key that drops a bomb; on a phone the 💣 button. */
export const bombKey = attackLabels.Enter
/** A bomb's burst is drawn this far above its impact, so the fire stands on the ground. */
const burstLift = 64
/** The front machine gun: seconds between shots and bullet speed in pixels per second, as the guns in Vis. */
export const gun = { reload: .1, speed: 1000 }
/**
 * The observer's twin gun fires back at fighters while the fire key is held, aimed by the observer: its reach in
 * pixels, the widest angle off straight back and the seconds between shots. Its rounds are not counted, so it fires
 * on when the front gun is empty.
 */
export const rearGun = { range: 600, cone: Math.PI / 3, reload: .2 }
/** The plane in partisan markings, and in the NDH markings it flew in until it went over to the partisans. */
export const markings = { partisan: 'armies/partizani/potez-25.png', ndh: 'armies/ndh/avioni/potez-25.png' }

/**
 * Franjo Kluz's Potez 25 in world coordinates. The camera moves on at the plane's airspeed; left and right change
 * that speed and also move the plane forward and back across the screen, up and down climb and dive.
 */
export default class Potez extends Player2D {
  /**
   * `groundAt(x)` gives the height of the surface under the wheels: the runway stands above the ground line `groundY`.
   * `onGround` starts the plane standing on the runway at `x`, to take off with up; `src` is one of `markings`.
   */
  /** `onAttack()` is called on every shot and bomb, which give away a disguised plane to the enemy who sees it. */
  constructor({ groundY, groundAt = () => groundY, camera, session, x = 200, y = 200, onGround = false, src = markings.partisan,
    onAttack = () => {} }) {
    super(src, { x, y, scale: .55, flammable: true, attackKey: 'Space', buttonDict: { attack: icons.shoot, special: icons.bomb } })
    this.groundY = groundY
    this.groundAt = groundAt
    this.camera = camera
    this.session = session
    this.onGround = onGround
    this.airspeed = onGround ? 0 : airspeed.start
    /** Speed across the screen, on top of the airspeed the camera keeps. */
    this.screenDx = 0
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.explosionSound)
    /** A burst when the plane is hit and another when its wreck hits the ground; loaded with the plane. */
    this.bursts = [new Explosion(camera), new Explosion(camera)]
    this.children.push(...this.bursts)
    /** Whether the shot down plane has hit the ground. */
    this.wrecked = false
    this.onAttack = onAttack
    /** Airspeed and sink rate when the wheels last touched the ground; null in the air. */
    this.touchdown = null
    /** What the gun and the bombs can hit. */
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Bullet(camera), onFire: inheritVelocity(this) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: gun.reload, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, gun.speed),
    })
    /** Fighters, which the observer fires back at. */
    this.fighters = []
    this.rearBullets = new ProjectilePool({ owner: this, create: () => new Bullet(camera), onFire: inheritVelocity(this) })
    this.rearWeapon = new Weapon({
      cooldown: new Cooldown({ seconds: rearGun.reload, clock: session.clock }),
      spawnProjectile: (position, angle) => this.rearBullets.fire(position, angle, gun.speed),
    })
    this.bombs = plane.bombs
    this.ammo = plane.ammo
    this.health = plane.health
    /** Holding the bomb key drops one bomb, not the whole load. */
    this.bombKeyHeld = false
    this.bombCooldown = new Cooldown({ seconds: plane.bombInterval, clock: session.clock })
    this.bombBay = Array.from({ length: plane.bombs }, () => new Bomb({ camera, groundAt, onImpact: bomb => this.blast(bomb) }))
    this.bombBursts = this.bombBay.map(() => new Explosion(camera))
    this.children.push(...this.bombBay, ...this.bombBursts)
  }

  /** The plane's height is known only once its picture has loaded. */
  onload() {
    if (this.onGround) this.y = this.groundAt(this.x) - this.height / 2
  }

  get offScreen() {
    return outsideView(this, this.camera)
  }

  get isGrounded() {
    return this.y + this.height / 2 >= this.groundAt(this.x)
  }

  /** A damaged plane smokes and a shot down one burns. */
  get burning() {
    return this.flammable && (this.dead || this.health < plane.health / 2)
  }

  get atCeiling() {
    return this.y - this.height / 2 <= this.groundY - plane.ceiling
  }

  /** KOMANDE ***/

  handleInput(dt) {
    super.handleInput(dt)
    const pressed = Boolean(this.input.keyboard?.pressed[bombKey] || this.input.screen?.special)
    if (pressed && !this.bombKeyHeld) this.dropBomb()
    this.bombKeyHeld = pressed
  }

  moveRight(dt) {
    this.airspeed = Math.min(airspeed.max, this.airspeed + airspeed.throttle * frames(dt))
    this.screenDx += this.thrust * frames(dt, this.tunedFps)
  }

  moveLeft(dt) {
    if (this.isGrounded) return
    this.airspeed = Math.max(airspeed.min, this.airspeed - airspeed.throttle * frames(dt))
    this.screenDx -= this.thrust * frames(dt, this.tunedFps)
  }

  moveUp(dt) {
    if (this.atCeiling) return
    if (this.isGrounded) this.airspeed = Math.max(this.airspeed, airspeed.start)
    super.moveUp(dt)
    if (this.angle === 0 || this.angle >= 2 * Math.PI - maxTilt)
      this.angle -= tiltRate * frames(dt)
  }

  moveDown(dt) {
    if (this.isGrounded) return
    super.moveDown(dt)
    if (this.angle <= maxTilt)
      this.angle += tiltRate * frames(dt)
  }

  /** The gun fires from the nose where the nose points; its reload goes by game time. */
  shoot() {
    if (this.session.state !== 'running' || this.dead) return
    this.fireBack()
    if (!this.ammo) return
    const nose = this.width / 2
    if (this.weapon.tryFire({ x: this.x + nose * Math.cos(this.angle), y: this.y + nose * Math.sin(this.angle) }, this.angle)) {
      this.ammo--
      this.onAttack()
    }
  }

  /** The nearest fighter behind the plane in reach of the observer's gun. */
  get rearTarget() {
    return this.fighters
      .filter(fighter => fighter.shown && fighter.alive)
      .filter(fighter => Math.hypot(fighter.x - this.x, fighter.y - this.y) <= rearGun.range)
      .filter(fighter => Math.abs(turn(Math.PI, this.angleTo(fighter))) <= rearGun.cone)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0]
  }

  fireBack() {
    if (this.session.state !== 'running' || this.dead) return
    const target = this.rearTarget
    if (target && this.rearWeapon.tryFire(this.position, this.angleTo(target))) this.onAttack()
  }

  /** The bomb leaves from under the wings with the plane's velocity. */
  dropBomb() {
    if (this.session.state !== 'running' || this.dead || this.isGrounded || !this.bombs || !this.bombCooldown.ready) return
    const bomb = this.bombBay.find(free => !free.visible)
    if (!bomb) return
    this.bombs--
    this.bombCooldown.start()
    this.onAttack()
    bomb.release({ x: this.x, y: this.y + this.height / 4 }, this)
  }

  /** A bomb on the ground destroys every living target whose body reaches into the blast. */
  blast({ x, y }) {
    const burst = this.bombBursts.find(free => !free.visible) ?? this.bombBursts[0]
    burst.start(x, y - burstLift)
    this.destroyAround({ x, y })
  }

  /** Destroys every living target whose body reaches within the blast radius of the point; vehicles burn. */
  destroyAround({ x, y }) {
    for (const target of this.targets) {
      const reach = plane.blastRadius + Math.max(target.width, target.height) / 2
      if (target.alive && Math.hypot(target.x - x, target.y - y) <= reach) target.die()
    }
  }

  /** OSTALO ***/

  levelOut(dt) {
    if (this.dead || this.input.up || this.input.down || this.angle === 0) return
    const step = tiltRate * frames(dt)
    const toLevel = this.angle < Math.PI ? this.angle : 2 * Math.PI - this.angle
    // steps vary with the frame length, so snap to level instead of overshooting it
    if (toLevel <= step) this.angle = 0
    else this.angle += this.angle < Math.PI ? -step : step
  }

  /** On the ground the plane rolls out, as it did when the old scenery slowed down. */
  brake(dt) {
    if (!this.isGrounded) return
    this.airspeed *= .9 ** frames(dt)
  }

  explode() {
    const burst = this.bursts.find(free => !free.visible) ?? this.bursts[0]
    burst.start(this.x, this.y)
    this.explosionSound.play()
  }

  takeHit(damage) {
    if (this.dead) return
    this.health -= damage
    if (this.health <= 0) this.die()
  }

  /** A hit or a crash blows the plane up in the air; it burns and falls with its speed. */
  die() {
    if (this.dead) return
    super.die()
    this.explode()
  }

  /** The falling wreck hits the ground nose first, blows up again and stops. */
  wreck() {
    this.wrecked = true
    this.airspeed = this.screenDx = 0
    this.explode()
  }

  /** The edges of the screen, the ground and the plane.ceiling stop the plane; a shot down plane is wrecked by the ground. */
  checkBounds() {
    const margin = this.width / 4
    const left = this.camera.cameraX + margin
    const right = this.camera.cameraX + canvas2d.width - margin
    if (this.x < left || this.x > right) {
      this.x = Math.min(right, Math.max(left, this.x))
      this.screenDx = 0
    }
    if (!this.isGrounded) this.touchdown = null
    else {
      this.touchdown ??= { airspeed: this.airspeed, sink: this.dy }
      this.y = this.groundAt(this.x) - this.height / 2
      if (this.dy > 0) this.dy = 0
      if (this.dead && !this.wrecked) this.wreck()
    }
    if (this.atCeiling && this.dy < 0) {
      this.y = this.groundY - plane.ceiling + this.height / 2
      this.dy = 0
    }
  }

  applyGravity(dt) {
    if (this.isGrounded) return
    this.addForce((this.dead ? wreckGravity : gravity) * frames(dt), Math.PI * .5)
  }

  checkCollisions() {
    if (this.dead) return
    this.solidBodies.forEach(body => {
      if (!this.collidesWith(body)) return
      this.die()
      body.die()
    })
  }

  update(dt, t) {
    this.engineSound.setPlaying(!this.dead)
    this.smoky = this.alive
    this.brake(dt)
    this.dx = this.airspeed + this.screenDx
    super.update(dt, t)
    // the fire crackles only on a shot down plane, not on a smoking one
    this.burnSound?.setPlaying(this.dead && this.visible)
    this.screenDx *= (1 - this.frictionFactor) ** frames(dt, this.tunedFps)
    this.checkCollisions()
    if (this.session.state === 'running') {
      this.bullets.checkHits(this.targets)
      this.rearBullets.checkHits(this.fighters)
    }
    this.applyGravity(dt)
    this.levelOut(dt)
    if (this.dead && !this.wrecked) this.angle += tumbleRate * dt
  }
}
