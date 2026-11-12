import Predmet from '/core/actor/Predmet.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Metak from '/core/actor/projektili/Metak.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from '/core/actor/targeting.js'

export default class Mitraljezac extends Predmet {
  constructor(x, y, cilj, session) {
    super('armies/nemci/mitraljezac-01.png', { x, y, z: -1, ishodiste: 'DOLE_DESNO' })
    this.session = session
    this.ciljevi = [cilj]
    this.bullets = new ProjectilePool({ owner: this, create: () => new Metak({ skalar: .4 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: .1, clock: session.clock }),
      barrels: [{ y: -10 }],
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 600),
    })
    this.burst = new Cooldown({ seconds: 3, clock: session.clock })
    this.burst.start()
    this.shots = 0
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running' || this.dead) return
    const cilj = nearestTarget(this.polozaj, this.ciljevi)
    if (cilj) this.ugao = this.ugaoKa(cilj) + Math.PI
    if (cilj && this.burst.ready && this.weapon.tryFire(this.polozaj, this.ugaoKa(cilj))) this.shots++
    if (this.shots === 5) {
      this.shots = 0
      this.burst.start()
    }
    this.bullets.checkHits(this.ciljevi)
  }
}
