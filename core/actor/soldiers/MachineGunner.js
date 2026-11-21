import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Projectile from '/core/actor/projectiles/Projectile.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { origins } from '/core/constants.js'
import { ctx } from '/core/io/canvas2d.js'
import art from './machineGunnerArt.js'

/**
 * The machine gun: the seconds between rounds, the rounds in one burst, the seconds of rest after a burst and before
 * the first one, and the round speed in pixels per second.
 */
export const machineGun = { reload: .1, burst: 5, pause: 3, speed: 600 }

/** The gunner holds fire, or fires bursts where he aims as often as his gun allows, until set to another. */
const states = {
  idle: {},
  fire: {
    update: gunner => {
      if (!gunner.burst.ready || !gunner.weapon.tryFire(gunner.muzzle, gunner.aimAngle)) return
      gunner.fireElapsed = 0
      if (++gunner.fired < machineGun.burst) return
      gunner.fired = 0
      gunner.burst.start()
    },
  },
  dead: {
    enter: gunner => {
      if (gunner.alive) gunner.die()
    },
  },
}

/** A machine gunner lying behind his gun, seen from above, who turns it anywhere. */
export default class MachineGunner extends GameObject2D {
  /** `targets` are what his rounds can hit. */
  constructor({ x, y, targets = [], session }) {
    super(art.src, { x, y, z: -1, width: art.width, height: art.height, origin: origins.bottomRight })
    this.fireElapsed = art.fireDuration
    this.deathElapsed = 0
    this.session = session
    this.targets = targets
    /** Where the gun points; the picture points it left. */
    this.aimAngle = Math.PI
    this.bullets = new ProjectilePool({ owner: this, create: () => new Projectile({ scale: .4 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: machineGun.reload, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, machineGun.speed),
    })
    this.burst = new Cooldown({ seconds: machineGun.pause, clock: session.clock })
    this.burst.start()
    /** The rounds of the burst fired so far. */
    this.fired = 0
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

  /** The gun turns all around, so each shot is a point ahead of him, level or high, in pixels. */
  get shots() {
    return { straight: { x: 400, y: 0 }, up: { x: 200, y: -400 } }
  }

  /** His rounds fly across the whole field. */
  get reach() {
    return Infinity
  }

  /** The way the gun points: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.aimAngle) < 0 ? -1 : 1
  }

  /** Turns the gun to `point`, which is always within his turn. */
  aimAt(point) {
    this.aimAngle = this.angleTo(point)
    this.angle = this.aimAngle + Math.PI
    return true
  }

  /** The tip of the drawn barrel, rotated around the accepted bottom-right origin. */
  get muzzle() {
    const x = art.muzzle.x - art.width, y = art.muzzle.y - art.height
    const cos = Math.cos(this.angle), sin = Math.sin(this.angle)
    return { x: this.x + x * cos - y * sin, y: this.y + x * sin + y * cos }
  }

  get fireFrame() {
    return Math.min(art.fireFrames - 1, Math.floor(this.fireElapsed / art.fireDuration * art.fireFrames))
  }

  die() {
    if (this.dead) return
    super.die()
    this.deathElapsed = 0
    this.machine.set('dead')
  }

  render() {
    if (!this.shown) return
    const firing = !this.dead && this.fireElapsed < art.fireDuration
    const frame = this.dead ? Math.min(3, Math.floor(this.deathElapsed / art.deathDuration * 4)) : firing ? this.fireFrame : 0
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, frame * art.width, this.dead ? art.height * 2 : firing ? art.height : 0,
      art.width, art.height, -this.width, -this.height, this.width, this.height)
    ctx.restore()
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running') return
    if (this.dead) {
      this.deathElapsed = Math.min(art.deathDuration, this.deathElapsed + dt)
      return
    }
    this.fireElapsed = Math.min(art.fireDuration, this.fireElapsed + dt)
    this.machine.update(dt)
    this.bullets.checkHits(this.targets)
  }
}
