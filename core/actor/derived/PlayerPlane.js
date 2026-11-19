import Sound from '/core/io/audio/SoundSource.js'
import Player2D from '/core/actor/Player2D.js'
import { frames } from '/core/constants.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Rocket from '/core/actor/projectiles/Rocket.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from '/core/actor/targeting.js'

const OKRET = 0.01
const MOGUCNOST_OKRETA = 0.066
const gravity = 3

export default class PlayerPlane extends Player2D {
  constructor(groundLevel, src = 'armies/partizani/potez-25.png', { session } = {}) {
    super(src, { scale: .55, flammable: true, buttonDict: { attack: '🚀', special: '🎯' } })
    this.speed = 0
    this.groundLevel = groundLevel
    this.session = session
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound)
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Rocket({ src: 'items/raketa.png', scale: .55 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: 1.5, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500),
    })
  }

  get isAtTop() {
    return this.y <= this.height / 2
  }

  get isGrounded() {
    return this.y + this.height / 2 >= this.groundLevel
  }

  checkBounds() {
    this.keepOnScreen()
  }

  /** KOMANDE ***/

  handleInput(dt) {
    super.handleInput(dt)
    if (this.input.special)
      this.shootAimed()
  }

  moveLeft(dt) {
    if (!this.isGrounded) super.moveLeft(dt)
  }

  moveUp(dt) {
    if (this.isAtTop) return

    super.moveUp(dt)
    if (this.angle === 0 || this.angle >= 2 * Math.PI - MOGUCNOST_OKRETA)
      this.angle -= OKRET * frames(dt)
  }

  moveDown(dt) {
    if (this.isGrounded) return

    super.moveDown(dt)
    if (this.angle <= MOGUCNOST_OKRETA)
      this.angle += OKRET * frames(dt)
  }

  shoot() {
    if (this.session.state !== 'running') return
    const poz = { x: this.x + 5, y: this.y + 15 }
    this.weapon.tryFire(poz, this.angle + Math.PI / 16)
  }

  shootAimed() {
    if (this.session.state !== 'running') return
    const target = nearestTarget(this.position, this.targets)
    if (target) this.weapon.tryFire(this.position, this.angleTo(target))
  }

  /** OSTALO ***/

  levelOut(dt) {
    if (this.input.up || this.input.down || this.angle === 0) return
    const korak = OKRET * frames(dt)
    const doVodoravnog = this.angle < Math.PI ? this.angle : 2 * Math.PI - this.angle
    // steps vary with the frame length, so snap to level instead of overshooting it
    if (doVodoravnog <= korak) this.angle = 0
    else this.angle += this.angle < Math.PI ? -korak : korak
  }

  checkGround() {
    if (!this.isGrounded) return
    if (this.angle > MOGUCNOST_OKRETA / 2) this.die()
  }

  applyGravity(dt) {
    if (this.isGrounded) return

    const teza = this.dead ? gravity * 100 : gravity
    this.addForce(teza * frames(dt), Math.PI * .5)
  }

  checkCollisions() {
    this.solidBodies.forEach(predmet => {
      if (!this.collidesWith(predmet)) return
      this.die()
      predmet.die()
    })
  }

  update(dt, t) {
    this.engineSound.setPlaying(!this.dead)
    super.update(dt, t)
    this.checkGround()
    this.checkCollisions()
    if (this.session.state === 'running') this.bullets.checkHits(this.targets)
    this.applyGravity(dt)
    this.levelOut(dt)
  }
}
