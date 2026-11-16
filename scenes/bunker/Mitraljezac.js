import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Projectile from '/core/actor/projectiles/Projectile.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from '/core/actor/targeting.js'

export default class Mitraljezac extends GameObject2D {
  constructor(x, y, cilj, session) {
    super('armies/nemci/mitraljezac-01.png', { x, y, z: -1, origin: 'DOLE_DESNO' })
    this.session = session
    this.targets = [cilj]
    this.bullets = new ProjectilePool({ owner: this, create: () => new Projectile({ scale: .4 }) })
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
    const cilj = nearestTarget(this.position, this.targets)
    if (cilj) this.angle = this.angleTo(cilj) + Math.PI
    if (cilj && this.burst.ready && this.weapon.tryFire(this.position, this.angleTo(cilj))) this.shots++
    if (this.shots === 5) {
      this.shots = 0
      this.burst.start()
    }
    this.bullets.checkHits(this.targets)
  }
}
