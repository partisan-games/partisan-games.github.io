import CombatTarget from './CombatTarget.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Metak from '/core/actor/projektili/Metak.js'
import Cooldown from '/core/gameplay/Cooldown.js'

const FIRST_SHOT_DELAY = 1.5
const RELOAD_SECONDS = 2.5
const PROJECTILE_SPEED = 320

export default class Bunker extends CombatTarget {
  constructor({ clock, target, ...rest } = {}) {
    super(rest)
    this.target = target
    this.reload = new Cooldown({ clock, seconds: RELOAD_SECONDS })
    this.reload.start(FIRST_SHOT_DELAY)
    this.projectiles = new ProjectilePool({ owner: this, create: () => new Metak() })
  }

  reset() {
    super.reset()
    this.reload.start(FIRST_SHOT_DELAY)
  }

  update(dt) {
    super.update(dt)
    if (this.dead || !this.target.prikazan || this.target.dead) return
    if (!this.prikazan) {
      this.reload.start(FIRST_SHOT_DELAY)
      return
    }
    if (!this.reload.ready) return

    const direction = this.target.x < this.x ? -1 : 1
    const position = { x: this.x + direction * this.sirina / 2, y: this.y }
    const angle = Math.atan2(this.target.y - position.y, this.target.x - position.x)
    this.projectiles.fire(position, angle, PROJECTILE_SPEED)
    this.reload.start()
  }
}
