import platno, { ctx } from '/core/io/platno.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'

const GUN_MOUNTS = [-84 / 300, 101 / 300]
const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const turn = (from, to, speed, dt) => from + Math.sign(difference(to, from)) * Math.min(Math.abs(difference(to, from)), speed * dt)

/** A single approach and withdrawal, with independently trained deck guns. */
export default class SBoat extends CombatTarget {
  constructor({ session, viewLeft, target }) {
    super({ session, viewLeft, maximum: 60, src: 'armies/game-ready/brodovi/schnellboot-s30.svg',
      sirina: 220, visina: 39.6, vidljiv: false })
    this.session = session
    this.target = target
    this.active = false
    this.bullets = new ProjectilePool({ owner: this, create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.steta = 5
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
    this.postavi(this.viewLeft() + platno.width + this.sirina / 2 + 20,
      platno.height * (side > 0 ? .7 : .3))
    this.ugao = Math.PI
    this.gunAngle = Math.PI
    this.gunIndex = 0
    this.shots = this.bursts = 0
    this.withdrawing = false
    this.born = this.session.clock.now
    this.wreckUntil = null
    this.active = true
    this.burstWait.start(1.8)
    this.weapon.cooldown.start(0)
    this.pokazi()
  }

  mount(index) {
    const offset = GUN_MOUNTS[index] * this.sirina
    return { x: this.x + Math.cos(this.ugao) * offset, y: this.y + Math.sin(this.ugao) * offset }
  }

  get muzzle() {
    const mount = this.mount(this.gunIndex)
    return { x: mount.x + Math.cos(this.gunAngle) * 12, y: mount.y + Math.sin(this.gunAngle) * 12 }
  }

  reagujNaPogodak(damage, lifeId = this.lifeId) {
    const alive = this.alive
    const applied = super.reagujNaPogodak(damage, lifeId)
    if (alive && this.dead) this.wreckUntil = this.session.clock.now + 5
    return applied
  }

  update(dt) {
    if (!this.active || this.session.state !== 'running' || this.dead) return
    const age = this.session.clock.now - this.born
    if (age > 10 || this.bursts >= 2) this.withdrawing = true
    const lane = platno.height * (this.side > 0 ? .7 : .3)
    const ahead = this.target.x + platno.width * .5
    const heading = this.withdrawing ? 0 : Math.atan2(lane - this.y, ahead - this.x)
    this.ugao = turn(this.ugao, heading, .65, dt)
    this.brzina = this.withdrawing ? 170 : 110
    super.update(dt)

    const mount = this.mount(this.gunIndex)
    const bearing = Math.atan2(this.target.y - mount.y, this.target.x - mount.x)
    this.gunAngle = turn(this.gunAngle, bearing, 1.2, dt)
    const distance = Math.hypot(this.target.x - mount.x, this.target.y - mount.y)
    if (this.withdrawing || this.target.dead || !this.target.prikazan || !this.prikazan ||
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
    if (!this.prikazan || !this.slika.naturalWidth) return
    ctx.save()
    ctx.globalAlpha = this.dead ? .55 : 1
    ctx.translate(this.x, this.y)
    ctx.rotate(this.ugao)
    ctx.drawImage(this.slika, -this.sirina / 2, -this.visina / 2, this.sirina, this.visina)
    ctx.restore()
    for (let i = 0; i < GUN_MOUNTS.length; i++) {
      const mount = this.mount(i)
      ctx.save()
      ctx.globalAlpha = this.dead ? .55 : 1
      ctx.translate(mount.x, mount.y)
      ctx.rotate(this.gunAngle)
      ctx.fillStyle = '#33483e'
      ctx.fillRect(-4, -2.5, 10, 5)
      ctx.fillStyle = '#aab8a1'
      ctx.fillRect(-3, -2, 6, 1)
      ctx.fillStyle = '#23352e'
      ctx.fillRect(3, -1, 9, 2)
      ctx.fillRect(9, -1.5, 3, 3)
      ctx.restore()
    }
  }
}
