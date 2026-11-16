import canvas2d, { ctx } from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'
import SinkingWreck from './SinkingWreck.js'

const GUN_MOUNTS = [-84 / 300, 101 / 300]
const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const turn = (from, to, speed, dt) => from + Math.sign(difference(to, from)) * Math.min(Math.abs(difference(to, from)), speed * dt)

/** A single approach and withdrawal, with independently trained deck guns. */
export default class SBoat extends CombatTarget {
  constructor({ session, viewLeft, target }) {
    super({ session, viewLeft, maximum: 60, src: 'armies/game-ready/brodovi/schnellboot-s30.svg',
      width: 275, height: 49.5, visible: false })
    this.session = session
    this.target = target
    this.active = false
    this.wreck = new SinkingWreck(this, session.clock)
    this.children.push(this.wreck.effects)
    this.bullets = new ProjectilePool({ owner: this, create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.damage = 5
      return bullet
    } })
    this.bullets.prepare(8)
    this.weapon = new Weapon({ cooldown: new Cooldown({ clock: session.clock, seconds: .22 }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500) })
    this.burstWait = new Cooldown({ clock: session.clock, seconds: 4 })
  }

  launch(side) {
    this.reset()
    this.side = side
    this.setPosition(this.viewLeft() + canvas2d.width + this.width / 2 + 20,
      canvas2d.height * (side > 0 ? .7 : .3))
    this.angle = Math.PI
    this.gunAngle = Math.PI
    this.gunIndex = 0
    this.shots = this.bursts = 0
    this.withdrawing = false
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
    if (alive && this.dead) this.wreck.start()
    return applied
  }

  update(dt) {
    if (!this.active || this.session.state !== 'running') return
    if (this.dead) {
      this.position.z = this.wreck.solid ? 0 : .5
      return
    }
    const age = this.session.clock.now - this.born
    if (age > 10 || this.bursts >= 2) this.withdrawing = true
    const lane = canvas2d.height * (this.side > 0 ? .7 : .3)
    const ahead = this.target.x + canvas2d.width * .5
    const heading = this.withdrawing ? 0 : Math.atan2(lane - this.y, ahead - this.x)
    this.angle = turn(this.angle, heading, .65, dt)
    this.speed = this.withdrawing ? 170 : 110
    super.update(dt)

    const mount = this.mount(this.gunIndex)
    const bearing = Math.atan2(this.target.y - mount.y, this.target.x - mount.x)
    this.gunAngle = turn(this.gunAngle, bearing, 1.2, dt)
    const distance = Math.hypot(this.target.x - mount.x, this.target.y - mount.y)
    if (this.withdrawing || this.target.dead || !this.target.shown || !this.shown ||
      distance < 160 || distance > 650 || Math.abs(difference(bearing, this.gunAngle)) > .08 || !this.burstWait.ready) return
    if (!this.weapon.tryFire(this.muzzle, this.gunAngle)) return
    this.gunIndex = (this.gunIndex + 1) % GUN_MOUNTS.length
    if (++this.shots === 3) {
      this.shots = 0
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
