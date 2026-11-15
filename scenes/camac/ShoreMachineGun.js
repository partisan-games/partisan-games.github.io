import { ctx } from '/core/io/platno.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import CombatTarget from './CombatTarget.js'
import BoatBullet from './BoatBullet.js'
import ShoreDestruction from './ShoreDestruction.js'

const difference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const FIRST_SHOT_DELAY = .4

/** A stationary infantry position, not a named model or a coastal artillery battery. */
export default class ShoreMachineGun extends CombatTarget {
  constructor({ session, viewLeft, target }) {
    super({ session, viewLeft, maximum: 30, src: 'armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg',
      sirina: 60, visina: 24, vidljiv: false })
    this.session = session
    this.target = target
    this.engaged = false
    this.shots = 0
    this.destruction = new ShoreDestruction(this, session)
    this.predmeti.push(this.destruction.drawable)
    this.bullets = new ProjectilePool({ owner: this, create: () => {
      const bullet = new BoatBullet(viewLeft)
      bullet.steta = 3
      return bullet
    } })
    this.bullets.prepare(8)
    this.weapon = new Weapon({ cooldown: new Cooldown({ clock: session.clock, seconds: .14 }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 600) })
    this.burstWait = new Cooldown({ clock: session.clock, seconds: 4.5 })
  }

  deploy(x, y, side) {
    this.reset()
    this.postavi(x, y)
    this.side = side
    this.ugao = side < 0 ? 0 : Math.PI
    this.gunAngle = side < 0 ? Math.PI / 2 : -Math.PI / 2
    this.engaged = false
    this.shots = 0
    this.weapon.cooldown.start(0)
    this.burstWait.start(FIRST_SHOT_DELAY)
    this.pokazi()
  }

  reset() {
    super.reset()
    this.destruction?.reset()
  }

  reagujNaPogodak(damage, lifeId = this.lifeId) {
    const alive = this.alive
    const applied = super.reagujNaPogodak(damage, lifeId)
    if (alive && this.dead) this.destruction.start()
    return applied
  }

  get mount() { return { x: this.x, y: this.y - this.side * 4 } }
  get muzzle() {
    const mount = this.mount
    return { x: mount.x + Math.cos(this.gunAngle) * 14, y: mount.y + Math.sin(this.gunAngle) * 14 }
  }

  update(dt) {
    if (this.session.state !== 'running' || !this.vidljiv) return
    this.destruction.update(dt)
    if (this.dead) return
    const mount = this.mount
    const dx = this.target.x - mount.x, dy = this.target.y - mount.y
    const bearing = Math.atan2(dy, dx)
    const waterDirection = this.side < 0 ? Math.PI / 2 : -Math.PI / 2
    const inSector = Math.abs(difference(bearing, waterDirection)) <= Math.PI * .4
    if (!this.prikazan || !this.target.prikazan || this.target.dead || !inSector || Math.hypot(dx, dy) > 520) {
      this.engaged = false
      this.shots = 0
      this.burstWait.start(FIRST_SHOT_DELAY)
      return
    }
    if (!this.engaged) {
      this.engaged = true
      this.burstWait.start(FIRST_SHOT_DELAY)
    }
    const change = difference(bearing, this.gunAngle)
    this.gunAngle += Math.sign(change) * Math.min(Math.abs(change), 1.8 * dt)
    if (Math.abs(difference(bearing, this.gunAngle)) > .08 || !this.burstWait.ready) return
    if (!this.weapon.tryFire(this.muzzle, this.gunAngle)) return
    if (++this.shots === 4) {
      this.shots = 0
      this.burstWait.start()
    }
  }

  render() {
    if (!this.prikazan || !this.slika.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.ugao)
    ctx.drawImage(this.slika, -30, -12, 60, 24)
    ctx.restore()
    const mount = this.mount
    ctx.save()
    ctx.translate(mount.x, mount.y)
    ctx.rotate(this.gunAngle)
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
