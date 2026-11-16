import canvas2d from '/core/io/canvas2d.js'
import CombatTarget from './CombatTarget.js'
import EnemyFire from './EnemyFire.js'
import { createAircraftGun, createAirBomb } from './EnemyWeapons.js'
import { shellGravity } from '../tenkici/shellPhysics.js'

const MAX_DIVE_ANGLE = Math.PI / 10
const PITCH_RATE = .35
const WRECK_FRICTION = 120

export default class Aircraft extends CombatTarget {
  constructor({ kind, art, clock, target, groundY, crashY = () => groundY + 60, scrollSpeed = -160, callback }) {
    super({ ...art, x: canvas2d.width + 250, y: 100, z: -1, flammable: true, callback, visible: false })
    this.kind = kind
    this.airborne = true
    this.target = target
    this.groundY = groundY
    this.clock = clock
    this.crashY = crashY
    this.scrollSpeed = scrollSpeed
    this.flightSpeed = Math.max(120, Math.min(320, canvas2d.width * .24)) * (kind === 'diveBomber' ? .8 : 1)
    this.active = false
    this.alive = false
    this.fire = new EnemyFire({ owner: this, target, clock, groundY,
      createWeapon: kind === 'diveBomber' ? createAirBomb : createAircraftGun,
      muzzle: () => this.muzzle,
    })
  }

  get muzzle() {
    const forward = this.kind === 'diveBomber' ? 0 : this.width * .4
    const angle = Math.atan2(this.dy, this.dx)
    return { x: this.x + Math.cos(angle) * forward, y: this.y + Math.sin(angle) * forward + this.height * .12 }
  }

  get muzzleAngle() {
    return Math.atan2(this.dy, this.dx)
  }

  launch() {
    this.reset()
    if (this.flame) this.flame.clear()
    this.setPosition(canvas2d.width + this.width / 2 + 20,
      this.groundY - Math.min(230, Math.max(120, canvas2d.height * .28)))
    this.dx = -this.flightSpeed
    this.dy = 0
    this.angle = 0
    this.active = true
    this.crashed = false
    this.wreckUntil = null
    this.attackStarted = false
    this.attackFinished = false
    this.divePitchTarget = 0
    this.pullUpY = this.groundY - Math.min(130, (this.groundY - this.y) * .6)
    this.bombReleased = false
    this.show()
    this.fire.reset()
  }

  checkBounds() {
    if (this.dead && !this.crashed && this.y >= this.crashY(this)) {
      this.y = this.crashY(this)
      this.dy = 0
      this.angle = -.12
      this.crashed = true
      this.wreckUntil = this.clock.now + 6
    }
    if (this.x + this.width / 2 < 0 ||
      (!this.dead && this.y - this.height / 2 > this.groundY) ||
      (this.crashed && this.clock.now >= this.wreckUntil)) {
      this.active = false
      this.vanish()
    }
  }

  bombWindow(dt) {
    if (this.bombReleased || this.target.y <= this.muzzle.y) return false
    const fallTime = Math.sqrt(2 * (this.target.y - this.muzzle.y) / shellGravity)
    const impactX = this.muzzle.x - this.flightSpeed * fallTime
    return this.x > this.target.x && Math.abs(impactX - this.target.x) <= this.flightSpeed * dt + 12
  }

  update(dt) {
    let attack = false
    if (this.active) {
      if (this.crashed) {
        const relativeSpeed = this.dx - this.scrollSpeed
        this.dx -= Math.sign(relativeSpeed) * Math.min(Math.abs(relativeSpeed), WRECK_FRICTION * dt)
      } else if (this.dead) {
        this.dy += 180 * dt
        this.angle = -Math.min(.55, Math.atan2(this.dy, Math.abs(this.dx)))
      } else if (!this.dead && this.kind === 'fighter') {
        const lead = this.x - this.target.x
        if (!this.attackStarted && lead > 160 && lead < Math.min(900, canvas2d.width * .9)) {
          this.attackStarted = true
          this.divePitchTarget = Math.min(MAX_DIVE_ANGLE, Math.atan2(Math.max(0, this.target.y - this.y), lead))
        }
        if (this.attackStarted && (this.y >= this.pullUpY || lead <= 180))
          this.attackFinished = true

        const pitch = Math.atan2(this.dy, this.flightSpeed)
        const desired = this.attackStarted && !this.attackFinished ? this.divePitchTarget : 0
        const change = desired - pitch
        const nextPitch = pitch + Math.sign(change) * Math.min(Math.abs(change), PITCH_RATE * dt)
        this.dy = this.flightSpeed * Math.tan(nextPitch)
        this.angle = Math.atan2(this.dy, this.dx) - Math.PI
        attack = this.attackStarted && !this.attackFinished && lead > 160
      }
      super.update(dt)
      if (this.kind === 'diveBomber' && !this.dead) attack = this.bombWindow(dt)
    }
    const fired = this.fire.update(this.active && !this.dead && attack)
    if (fired && this.kind === 'diveBomber') this.bombReleased = true
  }

  checkHits() {
    this.fire.checkHits()
  }
}
