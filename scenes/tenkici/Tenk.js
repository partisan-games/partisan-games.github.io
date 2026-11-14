import { keyboard } from '/core/io/Keyboard.js'
import platno from '/core/io/platno.js'
import Predmet from '/core/actor/Predmet.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Granata from '/core/actor/projektili/Granata.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Health from '/core/gameplay/Health.js'
import Weapon from '/core/gameplay/Weapon.js'
import { frames } from '/core/konstante.js'
import { shellGravity as gravitacija, shellSpeed as potisakMetka } from './shellPhysics.js'

const statickoTrenje = 0.3
const kinetickoTrenje = 0.1
const reloadTime = 1 // seconds
const burnBelow = 20 // energy at which a tank catches fire

/** Abstract class. `clock` is the game clock: reloading and the AI's timing wait in a pause. */
export default class Tenk extends Predmet {
  constructor(src, {
    clock,
    groundY,
    cevSlika,
    tenkDesno = false,
    skalar = window.innerWidth > 1280 ? 0.5 : 0.4,
    vremePunjenjaAI = 1.5, // seconds between AI shots
    ...rest
  } = {}) {
    super(src, { zapaljiv: true, skalar, z: -1, ...rest })
    this.health = new Health({ maximum: 100 })
    this.tenkDesno = tenkDesno
    this.cev = new Predmet(cevSlika, { skalar })
    this.cev.onload = () => this.azurirajCev()
    this.potisak = 25
    this.spremno = false
    this.ciljevi = []
    this.granate = new ProjectilePool({ owner: this, create: () => new Granata({ gravitacija, clock, nivoTla: groundY }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: reloadTime, clock }),
      spawnProjectile: (position, angle) => this.granate.fire(position, angle, potisakMetka),
    })
    // AI: each wait starts with the tank, as on the old wall clock
    this.ai = false
    this.smer = this.ugao
    this.aiPush = new Cooldown({ seconds: .07, clock })
    this.aiTurn = new Cooldown({ seconds: .3, clock })
    this.aiFire = new Cooldown({ seconds: vremePunjenjaAI, clock })
    ;[this.aiPush, this.aiTurn, this.aiFire].forEach(wait => wait.start())
    this.predmeti.push(this.cev)
  }

  onload() {
    this.azurirajCev()
  }

  get vrhCevi() {
    const x = Math.cos(this.cev.ugao) * this.cev.dijagonala + this.cev.x
    const y = Math.sin(this.cev.ugao) * this.cev.dijagonala + this.cev.y
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

  get zapaljen() {
    return this.zapaljiv && this.health.current <= burnBelow
  }

  get ugaoUnazad() {
    return this.ugao + Math.PI
  }

  /* PUCANJE */

  pokusajPucanje(binding) {
    if (keyboard.isDown(binding)) this.spremno = true
    if (this.spremno && !keyboard.isDown(binding)) {
      this.pucaj(this.vrhCevi, this.cev.ugao)
      this.spremno = false
    }
  }

  /** The recoil comes only with a shot that the reload allowed. */
  pucaj(poz, ugao) {
    if (this.weapon.tryFire(poz, ugao)) this.trzaj()
  }

  /** A push while a key is held, as one a frame at the frame rate the game was tuned at, on any screen. */
  vozi(snaga, ugao, dt) {
    this.dodajSilu(snaga * frames(dt, this.tunedFps), ugao)
  }

  trzaj() {
    this.dodajSilu(this.potisak, this.ugaoUnazad)
  }

  reagujNaPogodak(steta) {
    this.trzaj()
    this.health.damage(steta)
  }

  /* AI */

  nisani(predmet) {
    this.cev.ugao = Math.PI + this.razmakDo(predmet) / (gravitacija * gravitacija * 0.8)
  }

  izaberiSmer() {
    if (this.aiTurn.ready) {
      this.smer = Math.random() > 0.4 ? this.ugao : this.ugaoUnazad
      this.aiTurn.start()
    }

    if (this.x > platno.width * 0.9) this.smer = this.ugao
    if (this.x < platno.width / 2) this.smer = this.ugaoUnazad
  }

  povremenoDodajSilu() {
    if (this.aiPush.ready) {
      this.dodajSilu(Math.random() * this.potisak, this.smer)
      this.aiPush.start()
    }
  }

  mrdajNasumicno() {
    this.izaberiSmer()
    this.povremenoDodajSilu()
  }

  pucajNasumicno() {
    if (!this.aiFire.ready) return
    this.pucaj(this.vrhCevi, this.cev.ugao)
    this.aiFire.start()
  }

  najbliziCilj() {
    const zivi = this.ciljevi.filter(cilj => cilj.alive)
    return zivi.reduce((najblizi, cilj) => this.razmakDo(cilj) < this.razmakDo(najblizi) ? cilj : najblizi, zivi[0])
  }

  samohod() {
    if (this.dead) return
    this.mrdajNasumicno()
    const cilj = this.najbliziCilj()
    if (!cilj || cilj.dead) return
    this.nisani(cilj)
    this.pucajNasumicno()
  }

  /* LOOP */

  update(dt) {
    super.update(dt)
    if (this.ai) this.samohod()
    this.azurirajCev()
    this.trenje(this.brzina > 0.1 ? kinetickoTrenje : statickoTrenje, dt)
    this.granate.checkHits(this.ciljevi)
  }
}
