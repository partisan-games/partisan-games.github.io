import Sound from '/core/io/audio/SoundSource.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import GroundTarget from './GroundTarget.js'
import FlakShell from './FlakShell.js'
import Explosion from './Explosion.js'
import MuzzleFlash from './MuzzleFlash.js'
import WorldPart from './WorldPart.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import { turn } from './view.js'

/**
 * Light anti-aircraft fire: how far the gun reaches, in pixels, the seconds between shots, the shell speed, how close
 * to a burst the plane is hit, and how much of the plane's health one hit takes (five hits bring it down). A shell
 * bursts before the next shot, so one shell per gun is enough.
 */
export const flak = { range: 1000, reload: 3, shellSpeed: 600, burstRadius: 70, damage: 20 }
/**
 * The gun is drawn as a base and a barrel that turns about its breech. Measured on the 204 × 122 px picture: the
 * breech, the barrel's length and the angle it was drawn at. The barrel turns at `rate` radians a second, no lower
 * than `lowest` above the horizon, and fires only when it points within `onTarget` of where it aims.
 */
const picture = { width: 204, height: 122, breech: { x: 104, y: 44 }, barrelLength: 57, drawnAngle: Math.atan2(1 - 44, 66 - 104) }
const barrel = { rate: 1.5, lowest: .15, onTarget: .1 }
const scale = .75

/**
 * A crew at ease leaves the gun alone; set to fire, it trains the barrel on the plane and fires once on target; a
 * destroyed gun burns. Who sets it to fire, and when, is up to the world.
 */
const states = {
  idle: {},
  fire: {
    update: (gun, dt) => {
      gun.trainBarrel(dt)
      gun.fire()
    },
  },
  dead: {
    enter: gun => {
      if (gun.alive) gun.die()
    },
  },
}

/** A light anti-aircraft gun. It leads the plane and bursts its shell where the plane will be. */
export default class Flak extends GroundTarget {
  constructor({ plane, session, ...options }) {
    super({ src: 'armies/game-ready/artiljerija/flak38-postolje.png', health: 30, vehicle: true, scale, ...options })
    this.plane = plane
    this.session = session
    this.cooldown = new Cooldown({ seconds: flak.reload, clock: session.clock })
    // guns that come into view together do not fire together
    this.cooldown.start(Math.random() * flak.reload)
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .5, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shell = new FlakShell({ onBurst: shell => this.burst(shell) })
    this.burstSprite = new Explosion(this.camera, { scale: .75, smoke: true })
    this.barrel = new WorldPart('armies/game-ready/artiljerija/flak38-cev.png', { camera: this.camera, scale })
    this.muzzleFlash = new MuzzleFlash(this.camera)
    /** Where the barrel points, in radians: straight up is -π/2. */
    this.elevation = picture.drawnAngle
    this.children.push(this.barrel, this.shell, this.burstSprite, this.muzzleFlash)
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

  die() {
    if (this.dead) return
    super.die()
    this.machine.set('dead')
  }

  onload() {
    super.onload()
    this.placeBarrel()
  }

  get breech() {
    return {
      x: this.x + (picture.breech.x - picture.width / 2) * scale,
      y: this.y + (picture.breech.y - picture.height / 2) * scale,
    }
  }

  get muzzle() {
    const { x, y } = this.breech
    const length = picture.barrelLength * scale
    return { x: x + Math.cos(this.elevation) * length, y: y + Math.sin(this.elevation) * length }
  }

  /** Where the plane will be when a shell fired now reaches it, and the angle to there, if it is above and in reach. */
  aim() {
    const { plane } = this
    const { breech } = this
    if (plane.dead || plane.y >= breech.y) return null
    const distance = Math.hypot(plane.x - breech.x, plane.y - breech.y)
    if (distance > flak.range) return null
    const time = distance / flak.shellSpeed
    const x = plane.x + plane.dx * time
    const y = plane.y + plane.dy * time
    return { x, y, time, angle: Math.atan2(y - breech.y, x - breech.x) }
  }

  /** Turns the barrel towards where the gun aims, as fast as it can, never below the horizon. */
  trainBarrel(dt) {
    const target = this.aim()
    if (this.dead || !target) return
    const wanted = Math.max(-Math.PI + barrel.lowest, Math.min(-barrel.lowest, target.angle))
    const step = Math.max(-barrel.rate * dt, Math.min(barrel.rate * dt, turn(this.elevation, wanted)))
    this.elevation += step
  }

  /** The barrel turns about the breech, which is the middle of its picture. */
  placeBarrel() {
    const { x, y } = this.breech
    this.barrel.setPosition(x, y)
    this.barrel.angle = this.elevation - picture.drawnAngle
    const { muzzle } = this
    this.muzzleFlash.setPosition(muzzle.x, muzzle.y)
    this.muzzleFlash.angle = this.elevation
  }

  fire() {
    if (this.dead || this.session.state !== 'running' || !this.cooldown.ready) return
    const target = this.aim()
    if (!target || Math.abs(turn(this.elevation, target.angle)) > barrel.onTarget) return
    this.shell.fire(this.muzzle, this.elevation, flak.shellSpeed, target.time)
    this.muzzleFlash.start(this.muzzle, this.elevation)
    this.shotSound.play()
    this.cooldown.start()
  }

  burst({ x, y }) {
    this.burstSprite.start(x, y)
    const { plane } = this
    if (this.session.state === 'running' && Math.hypot(plane.x - x, plane.y - y) <= flak.burstRadius) plane.takeHit(flak.damage)
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.alive) this.machine.update(dt)
    this.placeBarrel()
  }
}
