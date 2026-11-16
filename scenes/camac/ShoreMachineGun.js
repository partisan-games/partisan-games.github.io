import { ctx } from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'
import ShoreDestruction from './ShoreDestruction.js'
import GameObject2D from '/core/actor/GameObject2D.js'

const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

/** A stationary infantry position, not a named model or a coastal artillery battery. */
export default class ShoreMachineGun extends CombatTarget {
  constructor({ session, viewLeft, target }) {
    super({ session, viewLeft, maximum: 30, src: 'armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg',
      width: 60, height: 24, visible: false })
    this.session = session
    this.target = target
    this.engaged = false
    this.shots = 0
    this.destruction = new ShoreDestruction(this, session)
    this.children.push(this.destruction.drawable)
    this.crew = new GameObject2D('armies/nemci-patrola.gif', { z: -.5, width: 24, height: 27 })
    this.crew.render = () => this.renderCrew()
    this.children.push(this.crew)
    this.bullets = new ProjectilePool({ owner: this, create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.damage = 3
      return bullet
    } })
    this.bullets.prepare(8)
    this.weapon = new Weapon({ cooldown: new Cooldown({ clock: session.clock, seconds: .14 }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 600) })
    this.burstWait = new Cooldown({ clock: session.clock, seconds: 4.5 })
  }

  deploy(x, y, side) {
    this.reset()
    this.setPosition(x, y)
    this.side = side
    this.angle = side < 0 ? 0 : Math.PI
    this.gunAngle = side < 0 ? Math.PI / 2 : -Math.PI / 2
    this.engaged = false
    this.shots = 0
    this.weapon.cooldown.start(0)
    this.burstWait.start(0)
    this.show()
  }

  reset() {
    super.reset()
    this.destruction?.reset()
  }

  takeHit(damage, lifeId = this.lifeId) {
    const { alive } = this
    const applied = super.takeHit(damage, lifeId)
    if (alive && this.dead) this.destruction.start()
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
    if (this.session.state !== 'running' || !this.visible) return
    this.destruction.update(dt)
    if (this.dead) return
    const { mount } = this
    const dx = this.target.x - mount.x, dy = this.target.y - mount.y
    const waterDirection = this.side < 0 ? Math.PI / 2 : -Math.PI / 2
    const bearing = waterDirection + Math.max(-Math.PI * .4,
      Math.min(Math.PI * .4, difference(Math.atan2(dy, dx), waterDirection)))
    if (!this.shown || !this.target.shown || this.target.dead || dy * this.side >= 0) {
      this.engaged = false
      this.shots = 0
      return
    }
    if (!this.engaged) {
      this.engaged = true
      this.gunAngle = bearing
      this.burstWait.start(0)
      this.weapon.cooldown.start(0)
    }
    const change = difference(bearing, this.gunAngle)
    this.gunAngle += Math.sign(change) * Math.min(Math.abs(change), 1.8 * dt)
    if (!this.burstWait.ready) return
    if (!this.weapon.tryFire(this.muzzle, this.gunAngle)) return
    if (++this.shots === 4) {
      this.shots = 0
      this.burstWait.start()
    }
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
