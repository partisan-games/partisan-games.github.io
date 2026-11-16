import { keyboard } from '/core/io/Keyboard.js'
import canvas2d from '/core/io/canvas2d.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Shell from '/core/actor/projectiles/Shell.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Health from '/core/gameplay/Health.js'
import Weapon from '/core/gameplay/Weapon.js'
import { frames } from '/core/constants.js'
import { shellGravity as gravity, shellSpeed as potisakMetka } from './shellPhysics.js'

const statickoTrenje = 0.3
const kinetickoTrenje = 0.1
const reloadTime = 1 // seconds
const burnBelow = 20 // energy at which a tank catches fire

/** Abstract class. `clock` is the game clock: reloading and the AI's timing wait in a pause. */
export default class Tenk extends GameObject2D {
  constructor(src, {
    clock,
    groundY,
    cevSlika,
    tenkDesno = false,
    scale = window.innerWidth > 1280 ? 0.5 : 0.4,
    vremePunjenjaAI = 1.5, // seconds between AI shots
    ...rest
  } = {}) {
    super(src, { flammable: true, scale, z: -1, ...rest })
    this.health = new Health({ maximum: 100 })
    this.tenkDesno = tenkDesno
    this.cev = new GameObject2D(cevSlika, { scale })
    this.cev.onload = () => this.azurirajCev()
    this.thrust = 25
    this.spremno = false
    this.targets = []
    this.granate = new ProjectilePool({ owner: this, create: () => new Shell({ gravity, clock, groundLevel: groundY }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: reloadTime, clock }),
      spawnProjectile: (position, angle) => this.granate.fire(position, angle, potisakMetka),
    })
    // AI: each wait starts with the tank, as on the old wall clock
    this.ai = false
    this.smer = this.angle
    this.aiPush = new Cooldown({ seconds: .07, clock })
    this.aiTurn = new Cooldown({ seconds: .3, clock })
    this.aiFire = new Cooldown({ seconds: vremePunjenjaAI, clock })
    ;[this.aiPush, this.aiTurn, this.aiFire].forEach(wait => wait.start())
    this.children.push(this.cev)
  }

  onload() {
    this.azurirajCev()
  }

  get vrhCevi() {
    const x = Math.cos(this.cev.angle) * this.cev.diagonal + this.cev.x
    const y = Math.sin(this.cev.angle) * this.cev.diagonal + this.cev.y
    return { x, y }
  }

  /* ZDRAVLJE: the old names, read from the one health */

  get energija() {
    return this.health.current
  }

  get alive() {
    return this.health.alive
  }

  /** Coming back to life restores full energy, as it always has. */
  set alive(value) {
    if (!this.health) return // Predmet sets it before the tank has its health, which starts full anyway
    if (value) this.health.reset()
    else this.health.damage(this.health.current)
  }

  get burning() {
    return this.flammable && this.health.current <= burnBelow
  }

  get ugaoUnazad() {
    return this.angle + Math.PI
  }

  pokusajPucanje(binding) {
    if (keyboard.isDown(binding)) this.spremno = true
    if (this.spremno && !keyboard.isDown(binding)) {
      this.fire(this.vrhCevi, this.cev.angle)
      this.spremno = false
    }
  }

  /** The recoil comes only with a shot that the reload allowed. */
  fire(poz, angle) {
    if (this.weapon.tryFire(poz, angle)) this.trzaj()
  }

  /** A push while a key is held, as one a frame at the frame rate the game was tuned at, on any screen. */
  vozi(snaga, angle, dt) {
    this.addForce(snaga * frames(dt, this.tunedFps), angle)
  }

  trzaj() {
    this.addForce(this.thrust, this.ugaoUnazad)
  }

  takeHit(damage) {
    this.trzaj()
    this.health.damage(damage)
  }

  nisani(predmet) {
    this.cev.angle = Math.PI + this.distanceTo(predmet) / (gravity * gravity * 0.8)
  }

  izaberiSmer() {
    if (this.aiTurn.ready) {
      this.smer = Math.random() > 0.4 ? this.angle : this.ugaoUnazad
      this.aiTurn.start()
    }

    if (this.x > canvas2d.width * 0.9) this.smer = this.angle
    if (this.x < canvas2d.width / 2) this.smer = this.ugaoUnazad
  }

  povremenoDodajSilu() {
    if (this.aiPush.ready) {
      this.addForce(Math.random() * this.thrust, this.smer)
      this.aiPush.start()
    }
  }

  mrdajNasumicno() {
    this.izaberiSmer()
    this.povremenoDodajSilu()
  }

  pucajNasumicno() {
    if (!this.aiFire.ready) return
    this.fire(this.vrhCevi, this.cev.angle)
    this.aiFire.start()
  }

  najbliziCilj() {
    const zivi = this.targets.filter(cilj => cilj.alive)
    return zivi.reduce((najblizi, cilj) => this.distanceTo(cilj) < this.distanceTo(najblizi) ? cilj : najblizi, zivi[0])
  }

  samohod() {
    if (this.dead) return
    this.mrdajNasumicno()
    const cilj = this.najbliziCilj()
    if (!cilj || cilj.dead) return
    this.nisani(cilj)
    this.pucajNasumicno()
  }

  update(dt) {
    super.update(dt)
    if (this.ai) this.samohod()
    this.azurirajCev()
    this.applyFriction(this.speed > 0.1 ? kinetickoTrenje : statickoTrenje, dt)
    this.granate.checkHits(this.targets)
  }
}
