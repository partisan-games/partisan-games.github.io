import WalkKeys from '/core/gameplay/controllers/WalkKeys.js'
import CoverFighter from '/core/gameplay/controllers/CoverFighter.js'

export const crouchKey = { codes: ['KeyC'], label: 'C' }
export const crouchHeight = 1.02
const postureSpeed = 4.4

/** Move the hitbox and eye together while keeping the feet in place. */
class Posture {
  constructor(body) {
    this.body = body
    this.standingHeight = body.size.height
  }

  get standingEye() {
    const { body, standingHeight } = this
    return { x: body.x, y: body.feet + standingHeight * body.strikeHeight, z: body.z }
  }

  update(crouched, dt) {
    const { body } = this
    body.crouched = crouched
    const goal = crouched ? crouchHeight : this.standingHeight
    const remaining = goal - body.size.height
    const change = Math.sign(remaining) * Math.min(Math.abs(remaining), postureSpeed * dt)
    body.size.height += change
    body.y += change / 2
    return Math.abs(remaining - change) < 1e-5
  }
}

export class YardWalk extends WalkKeys {
  constructor(body, input, { reloading, nearWall }) {
    super(body, input)
    this.posture = new Posture(body)
    this.reloading = reloading
    this.nearWall = nearWall
    this.walkSpeed = body.speed
    this.runScale = body.run
    this.waitingToStand = false
  }

  update(dt) {
    const { body, input } = this
    if (body.dead) return
    const manual = input.keyboard?.isDown(crouchKey) || input.screen?.special
    const loadingInCover = this.reloading() && this.nearWall(body) && (!body.swing || body.swing.landed)
    const crouched = !body.airborne && Boolean(manual || loadingInCover)
    const ready = this.posture.update(crouched, dt)
    if (manual || (!crouched && ready)) this.waitingToStand = false
    else if (loadingInCover) this.waitingToStand = true
    body.speed = this.walkSpeed * (crouched ? .55 : 1)
    body.run = crouched ? 1 : this.runScale
    super.update(dt)
  }
}

/** Cancels aim or fire as soon as that target ducks behind cover. */
export class YardAttacker extends CoverFighter {
  constructor(body, options) {
    super(body, options)
    this.clearShot = options.clearShot
  }

  update(dt) {
    const { body } = this
    if ((body.state === 'aim' || body.state === 'attack') && (!body.target?.alive || !this.clearShot(body, body.target))) {
      body.ceaseFire()
      return
    }
    super.update(dt)
  }
}

/** A defender pops up for a shot or a short burst, then crouches at his post between shots and to reload. */
export class YardDefender {
  constructor(body, { enemies, gun, sees, random = Math.random }) {
    Object.assign(this, { body, enemies, gun, sees, random })
    this.posture = new Posture(body)
    this.rounds = gun.magazine
    this.wait = .45 + random()
    this.shotWait = 0
    this.reload = 0
    this.target = null
    this.posture.update(true, 1)
  }

  canShoot(target, eye) {
    const { gun } = this
    return target?.alive && target.exposed !== false && !target.handedOver
      && Math.hypot(target.x - eye.x, target.y - eye.y, target.z - eye.z) < gun.reach
      && this.sees(eye, target)
  }

  update(dt) {
    const { body, gun, posture } = this
    if (body.dead) return
    this.wait = Math.max(0, this.wait - dt)
    this.shotWait = Math.max(0, this.shotWait - dt)
    if (this.reload > 0) {
      this.reload = Math.max(0, this.reload - dt)
      if (this.reload === 0) this.rounds = gun.magazine
      posture.update(true, dt)
      return
    }
    if (this.rounds === 0 && !body.swing) {
      this.reload = gun.reload
      this.target = null
      posture.update(true, dt)
      return
    }
    const eye = posture.standingEye
    if (this.target && !this.canShoot(this.target, eye)) this.target = null
    if (!this.target && this.wait === 0 && this.rounds > 0 && !body.swing && !body.hurt) {
      const visible = this.enemies.filter(enemy => this.canShoot(enemy, eye))
      this.target = visible[Math.floor(this.random() * visible.length)] ?? null
      this.burst = gun.automatic ? 4 : 1
      if (!this.target) this.wait = .16
    }
    const raised = Boolean((this.target || body.swing) && !body.hurt)
    const ready = posture.update(!raised, dt)
    if (!ready || !raised || !this.target || body.swing || this.shotWait > 0) return

    const { x, y, z } = this.target
    const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z
    const spread = () => (this.random() - .5) * .032
    body.yaw = Math.atan2(-dz, dx) + spread()
    body.pitch = Math.atan2(dy, Math.hypot(dx, dz)) + spread()
    body.attack()
    if (!body.swing) return
    this.rounds--
    this.shotWait = gun.repeat
    if (--this.burst === 0 || this.rounds === 0) {
      this.target = null
      this.wait = 1 + this.random() * 1.4
    }
  }
}
