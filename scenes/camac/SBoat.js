import Sound from '/core/io/audio/SoundSource.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'
import SinkingWreck from './SinkingWreck.js'

const GUN_MOUNTS = [-84 / 300, 101 / 300]
const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const turn = (from, to, speed, dt) => from + Math.sign(difference(to, from)) * Math.min(Math.abs(difference(to, from)), speed * dt)

/**
 * Cruising and full speed in pixels a second; how fast the hull and the guns turn, in radians a second; seconds
 * between rounds; rounds in a burst and seconds between bursts; the nearest and farthest the guns fire, in pixels,
 * once they are on aim within `onAim` radians; and where its lane lies, above and below, as a share of the view's height.
 */
export const sBoat = { cruise: 110, full: 170, turn: .65, gunTurn: 1.2, interval: .22, burst: 3, burstWait: 4,
  nearest: 160, reach: 650, onAim: .08, lanes: { above: .3, below: .7 } }

const sail = (boat, dt) => {
  boat.angle = turn(boat.angle, boat.course, sBoat.turn, dt)
  boat.speed = sBoat.cruise
}

/**
 * The boat lies still, or sails at cruising speed towards its `course`, firing its deck guns where they aim or not,
 * or turns back and withdraws at full speed, or sinks; who sets it, and when, is up to the world. Its guns follow
 * their aim in any state while it lives.
 */
const states = {
  idle: {
    enter: boat => boat.stop(),
  },
  sail: { update: sail },
  fire: { update: sail },
  withdraw: {
    update: (boat, dt) => {
      boat.angle = turn(boat.angle, 0, sBoat.turn, dt)
      boat.speed = sBoat.full
    },
  },
  dead: {
    enter: boat => boat.die(),
  },
}

/**
 * A single approach and withdrawal, with independently trained deck guns. The world may give it a `controller`, which
 * chooses its course and state each frame before the boat moves, while it lives in a running game.
 */
export default class SBoat extends CombatTarget {
  constructor({ session, viewLeft }) {
    super({ session, viewLeft, maximum: 60, src: 'armies/game-ready/brodovi/schnellboot-s30.svg',
      width: 275, height: 49.5, visible: false })
    this.session = session
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.muzzle } })
    this.sounds.push(this.shotSound)
    this.engineSound = new Sound('engine-boat.mp3', { volume: .25, loop: true, profile: 'engine', spatial: { getPosition: () => this.position, getRevision: () => this.lifeId } })
    this.sounds.push(this.engineSound)
    this.sinkingSound = new Sound('water-impact.mp3', { profile: 'impact', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.sinkingSound)
    this.active = false
    this.controller = null
    this.aim = null
    this.wreck = new SinkingWreck(this, session.clock)
    this.children.push(this.wreck.effects)
    this.bullets = new ProjectilePool({ owner: this, onFire: () => this.shotSound.play(), create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.damage = 5
      return bullet
    } })
    this.bullets.prepare(8)
    this.weapon = new Weapon({ cooldown: new Cooldown({ clock: session.clock, seconds: sBoat.interval }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500) })
    this.burstWait = new Cooldown({ clock: session.clock, seconds: sBoat.burstWait })
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

  /** Comes in bow first, from the right. */
  get forward() {
    return Math.sign(Math.cos(this.angle))
  }

  /** The deck guns turn all round; this one is straight ahead. */
  get shots() {
    return { straight: { x: 300, y: 0 } }
  }

  /** Trains the guns on `point`; they can fire at it if it is within their reach. */
  aimAt(point) {
    this.aim = { x: point.x, y: point.y }
    const mount = this.mount(this.gunIndex)
    const distance = Math.hypot(point.x - mount.x, point.y - mount.y)
    return distance >= sBoat.nearest && distance <= sBoat.reach
  }

  /** The height of the lane it sails along, below the middle of the river or above it. */
  get lane() {
    return canvas2d.height * (this.side > 0 ? sBoat.lanes.below : sBoat.lanes.above)
  }

  launch(side) {
    this.reset()
    this.side = side
    this.setPosition(this.viewLeft() + canvas2d.width + this.width / 2 + 20, this.lane)
    this.angle = Math.PI
    this.course = Math.PI
    this.gunAngle = Math.PI
    this.gunIndex = 0
    this.rounds = this.bursts = 0
    this.aim = null
    this.setState('idle')
    this.born = this.session.clock.now
    this.wreck.reset()
    this.position.z = 0
    this.active = true
    this.burstWait.start(1.8)
    this.weapon.cooldown.start(0)
    this.show()
  }

  mount(index) {
    const offset = GUN_MOUNTS[index] * this.width
    return { x: this.x + Math.cos(this.angle) * offset, y: this.y + Math.sin(this.angle) * offset }
  }

  get muzzle() {
    const mount = this.mount(this.gunIndex)
    return { x: mount.x + Math.cos(this.gunAngle) * 12, y: mount.y + Math.sin(this.gunAngle) * 12 }
  }

  takeHit(damage, lifeId = this.lifeId) {
    const { alive } = this
    const applied = super.takeHit(damage, lifeId)
    if (alive && this.dead) {
      this.wreck.start()
      this.sinkingSound.play()
      this.setState('dead')
    }
    return applied
  }

  update(dt) {
    this.engineSound.setPlaying(this.active && !this.dead)
    if (!this.active || this.session.state !== 'running') return
    if (this.dead) {
      this.position.z = this.wreck.solid ? 0 : .5
      return
    }
    this.controller?.update(dt)
    this.machine.update(dt)
    super.update(dt)
    if (!this.aim) return

    const mount = this.mount(this.gunIndex)
    const bearing = Math.atan2(this.aim.y - mount.y, this.aim.x - mount.x)
    this.gunAngle = turn(this.gunAngle, bearing, sBoat.gunTurn, dt)
    const distance = Math.hypot(this.aim.x - mount.x, this.aim.y - mount.y)
    if (this.state !== 'fire' || !this.shown || distance < sBoat.nearest || distance > sBoat.reach ||
      Math.abs(difference(bearing, this.gunAngle)) > sBoat.onAim || !this.burstWait.ready) return
    if (!this.weapon.tryFire(this.muzzle, this.gunAngle)) return
    this.gunIndex = (this.gunIndex + 1) % GUN_MOUNTS.length
    if (++this.rounds === sBoat.burst) {
      this.rounds = 0
      this.bursts++
      this.burstWait.start()
    }
  }

  render() {
    if (!this.shown || !this.image.naturalWidth) return
    const sinking = this.dead ? this.wreck.progress : 0
    if (sinking >= 1) return
    ctx.save()
    ctx.globalAlpha = (1 - sinking) ** .7
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(1 - sinking * .08, 1 - sinking * .45)
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    for (let i = 0; i < GUN_MOUNTS.length; i++) {
      ctx.save()
      ctx.translate(GUN_MOUNTS[i] * this.width, 0)
      ctx.rotate(this.gunAngle - this.angle)
      ctx.fillStyle = '#33483e'
      ctx.fillRect(-4, -2.5, 10, 5)
      ctx.fillStyle = '#aab8a1'
      ctx.fillRect(-3, -2, 6, 1)
      ctx.fillStyle = '#23352e'
      ctx.fillRect(3, -1, 9, 2)
      ctx.fillRect(9, -1.5, 3, 3)
      ctx.restore()
    }
    ctx.restore()
  }
}
