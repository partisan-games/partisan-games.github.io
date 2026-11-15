import CamacIgracOdozgo from '/core/actor/CamacIgracOdozgo.js'
import platno from '/core/io/platno.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import BoatBullet from './BoatBullet.js'
import CombatLife from './CombatLife.js'

/** This boat lives in river coordinates; only its vertical movement has screen bounds. */
export default class Boat extends CamacIgracOdozgo {
  constructor(viewLeft, session) {
    super()
    if (this.input.keyboard) this.input.keyboard.attackKey = 'Space'
    this.input.screen.addGameButtons({ attack: '💥' })
    this.viewLeft = viewLeft
    this.session = session
    this.combatLife = new CombatLife({ session, onDeath: () => this.stani() })
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
    if (!value) this.umri()
    else if (this.dead) this.reset()
  }
  get lifeId() { return this.combatLife.lifeId }
  get energija() { return this.combatLife.health.current }

  reagujNaPogodak(damage, lifeId = this.lifeId) {
    return this.combatLife.damage(damage, lifeId)
  }

  umri() { return this.reagujNaPogodak(this.energija) }
  reset() { this.stani(); this.combatLife.reset() }

  update(dt) {
    if (!this.dead) super.update(dt)
  }

  get muzzle() {
    return { x: this.x + Math.cos(this.ugao) * this.sirina / 2,
      y: this.y + Math.sin(this.ugao) * this.sirina / 2 }
  }

  puca() {
    if (this.session.state !== 'running' || this.dead || !this.prikazan) return false
    return this.weapon.tryFire(this.muzzle, this.ugao)
  }

  get prikazan() {
    const x = this.x - this.viewLeft()
    return this.vidljiv && x + this.sirina / 2 >= 0 && x - this.sirina / 2 <= platno.width &&
      this.y + this.visina / 2 >= 0 && this.y - this.visina / 2 <= platno.height
  }

  proveriGranice() {
    const margin = 75
    if (this.y < margin || this.y > platno.height - margin) {
      this.skreni(2 * Math.PI - this.ugao)
      this.dodajSilu(5)
    }
  }

  dodajStruju() {
    // World coordinates have no shore at x = 0; the current also acts upstream of it.
    this.dodajSilu(6, Math.PI)
  }
}
