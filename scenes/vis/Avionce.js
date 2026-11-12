import Player2D from '/core/actor/Player2D.js'
import Renderer2D from '/core/Renderer2D.js'
import platno from '/core/io/platno.js'
import { praviPucanje } from '/core/actor/prosirenja/pucanje.js'
import { after } from '/core/timers.js'
import { createSound } from '/core/io/sound.js'
import Explosion from './Explosion.js'
import { settings } from './settings.js'

const { lives, bombs, bombRadius, bombHits, bombBursts, bombSpread, respawnTime, shieldTime, blinkTime, loops, loop } = settings.player

export class Avionce extends Player2D {
  constructor() {
    super('armies/avionce.gif', { skalar: .75, zapaljiv: true, senka: true, buttonDict: { attack: '💥', attack2: '➰', special: '💣' } })
    this.brzina = 0
    this.poeni = 0
    this.zivoti = lives
    this.bombs = bombs
    this.specialHeld = this.attack2Held = false
    this.loopsLeft = loops
    this.loopAge = null // seconds into the loop, while it lasts
    this.shield = 0 // seconds of safety left after coming back
    this.explosions = Array.from({ length: bombBursts }, () => new Explosion()) // loaded before the first bomb
    this.predmeti.push(...this.explosions)
    Object.assign(this, praviPucanje({ potisakMetka: 1000, vremePunjenja: .1, ugloviPucanja: [-.33, 0, .33] }))
  }

  onload() {
    this.toStart()
  }

  toStart() {
    this.postavi(platno.width / 2, platno.height - this.visina)
  }

  get looping() {
    return this.loopAge !== null
  }

  /** Neither a bullet nor a crash takes a life: just after coming back, and during a loop. */
  get invulnerable() {
    return this.shield > 0 || this.looping
  }

  proveriGranice() {
    this.ogranici()
  }

  puca() {
    const poz = { x: this.x, y: this.y - this.visina / 4 }
    this.pali(poz, Math.PI * 1.5)
  }

  handleInput(dt) {
    super.handleInput(dt)
    if (this.input.special && !this.specialHeld) this.dropBomb()
    this.specialHeld = this.input.special
    if (this.input.attack2 && !this.attack2Held) this.startLoop()
    this.attack2Held = this.input.attack2
  }

  startLoop() {
    if (!this.loopsLeft || this.looping) return

    this.loopsLeft--
    this.loopAge = 0
  }

  /** The plane grows as it climbs, turns over on its back and comes down where it began, a little ahead and back. */
  flyLoop(dt) {
    const lift = progress => Math.sin(Math.PI * progress)
    const before = Math.min(this.loopAge / loop.duration, 1)
    this.loopAge += dt
    const progress = Math.min(this.loopAge / loop.duration, 1)

    this.scaleX = 1 + loop.grow * lift(progress)
    this.scaleY = this.scaleX * Math.cos(2 * Math.PI * progress) // 1, 0, -1 on its back, 0 and 1 again
    this.y -= loop.ahead * (lift(progress) - lift(before))
    if (progress === 1) this.loopAge = null
  }

  /** A heavy blow to every enemy plane around the player: fighters and heavy planes go down, the boss is hurt. */
  dropBomb() {
    if (!this.bombs) return

    this.bombs--
    createSound('explosion.mp3').play()
    const radius = bombRadius * Math.min(platno.width, platno.height)
    // every plane the fire touches goes down, also one just past the outermost burst
    this.ciljevi
      .filter(plane => plane.alive && this.razmakDo(plane) < radius + Explosion.reach)
      .forEach(plane => {
        plane.damage(bombHits)
        this.scoreIfDown(plane)
        this.explode(plane.x, plane.y)
      })
    this.spreadBursts(radius)
  }

  /** Explosions at random places in the blast, a little apart in time. */
  spreadBursts(radius) {
    for (let i = 0; i < bombBursts; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = radius * Math.sqrt(Math.random()) // evenly over the circle, not crowded in the middle
      const x = this.x + Math.cos(angle) * distance
      const below = Math.sin(angle) * distance
      const y = this.y + (this.y + below > platno.height ? -below : below) // a burst under the screen's edge shows above instead
      after(Math.random() * bombSpread, () => this.explode(x, y))
    }
  }

  explode(x, y) {
    let explosion = this.explosions.find(burst => !burst.vidljiv)
    if (!explosion) {
      explosion = new Explosion()
      this.explosions.push(explosion)
      this.predmeti.push(explosion)
    }
    explosion.start(x, y)
  }

  scoreIfDown(plane) {
    if (plane.dead) this.poeni += plane.points
  }

  /** A bullet takes a life unless the plane is invulnerable. */
  reagujNaPogodak() {
    if (!this.invulnerable) this.umri()
  }

  /** A crash into an enemy plane takes a life and one hit of the enemy. */
  checkCrashes() {
    if (!this.alive || this.invulnerable) return

    const enemy = this.ciljevi.find(plane => plane.alive && this.sudara(plane))
    if (!enemy) return
    enemy.damage(1)
    this.umri()
  }

  /** The plane comes back at the bottom of the screen, safe for a while, with its loops. */
  reset() {
    this.alive = true
    this.scaleX = this.scaleY = 1
    this.stani()
    this.toStart()
    this.shield = shieldTime
    this.loopsLeft = loops
  }

  umri() {
    this.alive = false
    this.loopAge = null
    this.pada = true
    this.zivoti--
    after(respawnTime, () => {
      this.pada = false
      if (this.zivoti) this.reset()
    })
  }

  update(dt, t) {
    if (this.looping) this.flyLoop(dt)
    this.shield = Math.max(this.shield - dt, 0)
    super.update(dt, t)
    this.ciljevi.forEach(plane => this.proveriPogodak(plane, () => this.scoreIfDown(plane)))
    this.checkCrashes()

    if (this.pada)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }

  /** Just after coming back, the plane blinks between solid and faint. */
  render() {
    const renderer = Renderer2D.instance
    const faint = this.shield > 0 && Math.floor(this.shield / blinkTime) % 2
    renderer.ctx.save()
    if (faint) renderer.ctx.globalAlpha = .3
    renderer.crtaPredmet(this)
    renderer.ctx.restore()
  }
}
