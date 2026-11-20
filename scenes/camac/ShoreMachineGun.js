import Sound from '/core/io/audio/SoundSource.js'
import { ctx } from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'
import ShoreDestruction from './ShoreDestruction.js'
import GameObject2D from '/core/actor/GameObject2D.js'

const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

/**
 * How far the gun swings either way from straight out over the water and how fast it turns, in radians and radians a
 * second; seconds between rounds; rounds in a burst and seconds between bursts.
 */
export const nest = { swing: Math.PI * .4, turn: 1.8, interval: .14, burst: 4, burstWait: 4.5 }

/**
 * The nest holds fire, or fires bursts where it aims while it is in view, or lies destroyed; who sets it, and when,
 * is up to the world. Opening fire swings the gun straight to its aim and fires at once.
 */
const states = {
  idle: {
    update: gun => gun.disengage(),
  },
  fire: {
    update: (gun, dt) => gun.fireBurst(dt),
  },
  dead: {
    enter: gun => gun.die(),
  },
}

/**
 * A stationary infantry position, not a named model or a coastal artillery battery. The world may give it a
 * `controller`, which chooses its state each frame the nest lives in a running game.
 */
export default class ShoreMachineGun extends CombatTarget {
  constructor({ session, viewLeft }) {
    super({ session, viewLeft, maximum: 30, src: 'armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg',
      width: 60, height: 24, visible: false })
    this.session = session
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.muzzle } })
    this.sounds.push(this.shotSound)
    this.fireSound = new Sound('fire.mp3', { volume: .4, loop: true, profile: 'fire', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.fireSound)
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.explosionSound)
    this.engaged = false
    this.rounds = 0
    this.destruction = new ShoreDestruction(this, session)
    this.children.push(this.destruction.drawable)
    this.crew = new GameObject2D('armies/nemci-patrola.gif', { z: -.5, width: 24, height: 27 })
    this.crew.render = () => this.renderCrew()
    this.children.push(this.crew)
    this.bullets = new ProjectilePool({ owner: this, onFire: () => this.shotSound.play(), create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.damage = 3
      return bullet
    } })
    this.bullets.prepare(8)
    this.weapon = new Weapon({ cooldown: new Cooldown({ clock: session.clock, seconds: nest.interval }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 600) })
    this.burstWait = new Cooldown({ clock: session.clock, seconds: nest.burstWait })
    this.bearing = null
    this.controller = null
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

  /** The crew faces along the shore. */
  get forward() {
    return Math.sign(Math.cos(this.angle))
  }

  /** Straight out over the water. */
  get shots() {
    return { straight: { x: 0, y: -this.side * 200 } }
  }

  /** Swings the aim towards `point`, as far as the nest allows; it can fire only at a point out over the water. */
  aimAt(point) {
    const { mount } = this
    const dx = point.x - mount.x, dy = point.y - mount.y
    const waterDirection = this.side < 0 ? Math.PI / 2 : -Math.PI / 2
    this.bearing = waterDirection + Math.max(-nest.swing, Math.min(nest.swing, difference(Math.atan2(dy, dx), waterDirection)))
    return dy * this.side < 0
  }

  disengage() {
    this.engaged = false
    this.rounds = 0
  }

  fireBurst(dt) {
    if (!this.shown || this.bearing === null) {
      this.disengage()
      return
    }
    if (!this.engaged) {
      this.engaged = true
      this.gunAngle = this.bearing
      this.burstWait.start(0)
      this.weapon.cooldown.start(0)
    }
    const change = difference(this.bearing, this.gunAngle)
    this.gunAngle += Math.sign(change) * Math.min(Math.abs(change), nest.turn * dt)
    if (!this.burstWait.ready) return
    if (!this.weapon.tryFire(this.muzzle, this.gunAngle)) return
    if (++this.rounds === nest.burst) {
      this.rounds = 0
      this.burstWait.start()
    }
  }

  deploy(x, y, side) {
    this.reset()
    this.setPosition(x, y)
    this.side = side
    this.angle = side < 0 ? 0 : Math.PI
    this.gunAngle = side < 0 ? Math.PI / 2 : -Math.PI / 2
    this.engaged = false
    this.rounds = 0
    this.bearing = null
    this.weapon.cooldown.start(0)
    this.burstWait.start(0)
    this.show()
  }

  reset() {
    super.reset()
    this.destruction?.reset()
    this.machine?.set('idle')
  }

  takeHit(damage, lifeId = this.lifeId) {
    const { alive } = this
    const applied = super.takeHit(damage, lifeId)
    if (alive && this.dead) {
      this.destruction.start()
      this.explosionSound.play()
      this.setState('dead')
    }
    return applied
  }

  get mount() {
    return { x: this.x, y: this.y - this.side * 4 }
  }
  get muzzle() {
    const { mount } = this
    return { x: mount.x + Math.cos(this.gunAngle) * 14, y: mount.y + Math.sin(this.gunAngle) * 14 }
  }

  update(dt) {
    this.fireSound.setPlaying(this.visible && this.dead)
    if (this.session.state !== 'running' || !this.visible) return
    this.destruction.update(dt)
    if (this.dead) return
    this.controller?.update(dt)
    this.machine.update(dt)
  }

  renderCrew() {
    if (!this.shown || !this.crew.image.naturalWidth) return
    const fallen = this.dead ? Math.min(1, Math.max(0,
      (this.session.clock.now - this.destruction.startedAt) / .35)) : 0
    ctx.save()
    for (const offset of [-14, 14]) {
      const side = offset < 0 ? -1 : 1
      ctx.save()
      ctx.translate(this.x + Math.cos(this.angle) * (offset + side * fallen * 5),
        this.y + Math.sin(this.angle) * offset + this.side * fallen * 3)
      ctx.rotate(this.gunAngle + Math.PI * .75 + (offset < 0 ? 0 : .15) + side * fallen * 1.2)
      if (this.dead) {
        // Separate the dropped rifle from the collapsed body instead of keeping the aiming pose.
        ctx.filter = 'brightness(.65) saturate(.4)'
        ctx.scale(1 + fallen * .15, 1 - fallen * .2)
        ctx.drawImage(this.crew.image, 8, 14, 24, 22, -9, -8, 18, 16.5)
        ctx.filter = 'none'
        ctx.translate(side * 11, 4)
        ctx.rotate(side * .8)
        ctx.fillStyle = '#51432e'
        ctx.fillRect(-1, -4, 2, 8)
        ctx.fillStyle = '#242b29'
        ctx.fillRect(-.5, -11, 1, 9)
      } else
        ctx.drawImage(this.crew.image, 0, 0, 32, 36, -12, -13.5, 24, 27)

      ctx.restore()
    }
    ctx.restore()
  }

  render() {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.drawImage(this.image, -30, -12, 60, 24)
    ctx.restore()
    const { mount } = this
    ctx.save()
    ctx.translate(mount.x, mount.y)
    ctx.rotate(this.gunAngle + (this.dead ? .9 : 0))
    ctx.fillStyle = '#374538'
    ctx.fillRect(-4, -2, 9, 4)
    ctx.fillStyle = '#1e2c25'
    ctx.fillRect(3, -.8, 11, 1.6)
    ctx.strokeStyle = '#687563'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(12, -3)
    ctx.moveTo(10, 0)
    ctx.lineTo(12, 3)
    ctx.stroke()
    ctx.restore()
  }
}
