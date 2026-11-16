import TopDownPlayerBoat from '/core/actor/TopDownPlayerBoat.js'
import canvas2d from '/core/io/canvas2d.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import BoatBullet from './BoatBullet.js'
import CombatLife from './CombatLife.js'

/** This boat lives in river coordinates; only its vertical movement has screen bounds. */
export default class Boat extends TopDownPlayerBoat {
  constructor(viewLeft, session, startX = 0) {
    super()
    if (this.input.keyboard) this.input.keyboard.attackKey = 'Space'
    this.input.screen.addGameButtons({ attack: '💥' })
    this.viewLeft = viewLeft
    this.startX = startX
    this.session = session
    this.combatLife = new CombatLife({ session, onDeath: () => this.stop() })
    this.bullets = new ProjectilePool({ owner: this, create: () => new BoatBullet(viewLeft) })
    this.bullets.prepare(8)
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: .18, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 700),
    })
  }

  get alive() { return this.combatLife?.health.alive ?? true }
  set alive(value) {
    if (!this.combatLife) return
    if (!value) this.die()
    else if (this.dead) this.reset()
  }
  get lifeId() { return this.combatLife.lifeId }
  get energija() { return this.combatLife.health.current }

  takeHit(damage, lifeId = this.lifeId) {
    return this.combatLife.damage(damage, lifeId)
  }

  die() { return this.takeHit(this.energija) }
  reset() { this.stop(); this.controlsLocked = false; this.combatLife.reset() }

  update(dt) {
    if (!this.dead && !this.controlsLocked) super.update(dt)
  }

  handleInput(dt) {
    if (!this.controlsLocked) super.handleInput(dt)
  }

  get muzzle() {
    return { x: this.x + Math.cos(this.angle) * this.width / 2,
      y: this.y + Math.sin(this.angle) * this.width / 2 }
  }

  shoot() {
    if (this.session.state !== 'running' || this.dead || this.controlsLocked || !this.shown) return false
    return this.weapon.tryFire(this.muzzle, this.angle)
  }

  get shown() {
    const x = this.x - this.viewLeft()
    return this.visible && x + this.width / 2 >= 0 && x - this.width / 2 <= canvas2d.width &&
      this.y + this.height / 2 >= 0 && this.y - this.height / 2 <= canvas2d.height
  }

  checkBounds() {
    if (this.x <= this.startX) {
      this.x = this.startX
      if (this.dx < 0) this.dx = 0
    }
    const margin = 75
    if (this.y < margin || this.y > canvas2d.height - margin) {
      this.turn(2 * Math.PI - this.angle)
      this.addForce(5)
    }
  }

  applyCurrent() {
    if (this.x <= this.startX && this.dx <= 0) return
    this.addForce(6, Math.PI)
  }
}
