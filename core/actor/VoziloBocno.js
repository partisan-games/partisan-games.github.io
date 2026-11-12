import Predmet from './Predmet.js'
import ProjectilePool from './ProjectilePool.js'
import Metak from './projektili/Metak.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from './targeting.js'

export default class VoziloBocno extends Predmet {
  constructor(src, { session, ...params } = {}) {
    super(src, { brzina: 120, zapaljiv: true, ...params })
    this.oznake.add('neprijatelj')
    this.session = session
    this.ciljevi = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Metak({ src: 'items/raketa.png', skalar: .55 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: 10, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500),
    })
    this.weapon.cooldown.start()
  }

  onload() {
    this.y -= this.visina / 2
  }

  patroliraj() {
    if (this.dead) return

    if (this.x <= 150)
      this.skreni(0)

    if (this.x >= 600)
      this.skreni(Math.PI)

    this.azurirajSliku()
  }

  azurirajSliku() {
    this.odrazX = this.ugao === Math.PI ? -1 : 1
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running') return
    const target = nearestTarget(this.polozaj, this.ciljevi)
    if (!this.dead && target) this.weapon.tryFire(this.polozaj, this.ugaoKa(target))
    this.bullets.checkHits(this.ciljevi)
  }
}
