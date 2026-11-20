import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Projectile from '/core/actor/projectiles/Projectile.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import Weapon from '/core/gameplay/Weapon.js'
import Sound from '/core/io/audio/SoundSource.js'
import { settings } from './settings.js'
import { resetFlame } from './flame.js'
import AircraftPropellers from '/core/actor/aircraft/AircraftPropellers.js'

/** Seconds a shot down plane falls before it is gone, and px per second of its bullets. */
export const enemy = { fallTime: 2, bulletSpeed: 350 }
const pick = list => list[Math.floor(Math.random() * list.length)]
const outside = 150 // px past the edge where a plane that has left the screen is gone

// by the plane's center, since its size is unknown until its image loads
const isOnScreen = ({ x, y }) => x >= 0 && x <= canvas2d.width && y >= 0 && y <= canvas2d.height
const isFarOut = ({ x, y }) => x < -outside || x > canvas2d.width + outside || y < -outside || y > canvas2d.height + outside

/**
 * The plane flies where it is put; set to fire, it also fires where it aims as often as its guns reload; shot down,
 * it falls. Who sets it to fire, and when, is up to the world.
 */
const states = {
  idle: {},
  fire: {
    update: plane => plane.shoot(),
  },
  dead: {
    enter: plane => {
      if (plane.alive) plane.die()
    },
    update: (plane, dt) => {
      plane.scaleX = plane.scaleY = plane.scaleX * Math.pow(0.8, dt)
    },
  },
}

/**
 * An enemy plane seen from above that fires at a point and falls when shot down. Its shots and its fall wait on the
 * game `session`. The world may give it a `controller` that flies and fires it: it takes the plane's step where the
 * plane once flew its own path, and may silence its engine by `engineRunning`.
 */
export default class Enemy extends GameObject2D {
  constructor({ session, type = 'fighter' }) {
    const kind = settings.enemies[type]
    super(pick(kind.images), { scale: kind.scale, flammable: true, shadow: true })
    this.propellers = new AircraftPropellers(this.image.src)
    this.engineSound = new Sound('engine-aircraft.mp3', { loop: true, profile: 'engine', volume: .2, spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.nextGun() } })
    this.sounds.push(this.engineSound, this.explosionSound, this.shotSound)
    this.type = type
    this.points = kind.points
    this.maxHits = this.hits = kind.hits
    this.session = session
    this.flightSpeed = kind.speed
    this.fireInterval = kind.fire.interval
    this.entered = this.gone = false
    this.engineRunning = true
    this.controller = null
    this.aim = null
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Projectile() })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: kind.fire.interval, clock: session.clock }),
      barrels: kind.fire.spread.map(angle => ({ angle })),
      spawnProjectile: (origin, angle) => {
        this.bullets.fire(origin, angle, enemy.bulletSpeed)
        this.shotSound.play()
      },
    })
    this.weapon.cooldown.start(kind.fire.interval * Math.random()) // planes of a formation do not fire together
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

  /** Turns the nose the way it flies; the image points up. */
  face(direction) {
    this.angle = direction + Math.PI / 2
  }

  /** A plane starts outside the screen; once it has flown in and out again, it is gone. */
  checkGone() {
    if (isOnScreen(this)) this.entered = true
    else if (this.entered && isFarOut(this)) this.gone = true
  }

  /** A bullet is one hit, whatever damage it carries. */
  takeHit() {
    this.damage(1)
  }

  damage(hits) {
    if (this.dead) return
    if (!this.burning) resetFlame(this)
    this.hits -= hits
    if (this.hits <= 0) this.die()
  }

  /** A heavy plane catches fire when half of its hits are gone. */
  get burning() {
    return this.flammable && (this.dead || this.hits <= this.maxHits / 2)
  }

  /** A shot down plane leaves its path and formation and goes on straight ahead, the way its nose points. */
  die() {
    if (!this.burning) resetFlame(this)
    super.die()
    this.explosionSound.play()
    const heading = this.angle - Math.PI / 2 // the image points up
    this.dx = this.flightSpeed * Math.cos(heading)
    this.dy = this.flightSpeed * Math.sin(heading)
    this.session.gameplay.after(enemy.fallTime, () => {
      this.gone = true
    })
    this.machine.set('dead')
  }

  /** The guns turn every way, so the plane fires down at the panel's shot. */
  get shots() {
    return { straight: { x: 0, y: 300 } }
  }

  /** Seen from above the plane has no side it faces; 1 as right. */
  get forward() {
    return 1
  }

  /** It fires at any distance, but only from the screen. */
  get reach() {
    return Infinity
  }

  /** The guns turn every way: the plane aims at `point` wherever it moves, and can fire there while it is on the screen. */
  aimAt(point) {
    this.aim = point
    return isOnScreen(this)
  }

  /** Where the next shot leaves from. */
  nextGun() {
    return { x: this.x, y: this.y }
  }

  /** Fires where it aims, if its guns have reloaded; each wait is a little longer or shorter. */
  shoot() {
    if (!this.alive || !this.aim || !this.weapon.cooldown.ready) return

    const gun = this.nextGun()
    if (this.weapon.tryFire(gun, Math.atan2(this.aim.y - gun.y, this.aim.x - gun.x)))
      this.weapon.cooldown.start(this.fireInterval * randomInRange(.8, 1.2))
  }

  update(dt, t) {
    this.propellers.update(dt, this.alive && !this.gone && this.engineRunning)
    this.engineSound.setPlaying(this.alive && !this.gone && this.engineRunning)
    this.controller?.update?.(dt)
    if (this.alive) this.checkGone()
    super.update(dt, t)
    this.machine.update(dt)
    this.bullets.checkHits(this.targets)
  }
}
