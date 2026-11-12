import Player2D from '/core/actor/Player2D.js'
import platno from '/core/io/platno.js'
import { praviPucanje } from '/core/actor/prosirenja/pucanje.js'
import { after } from '/core/timers.js'
import { createSound } from '/core/io/sound.js'
import { settings } from './settings.js'

const { lives, bombs, bombRadius, bombHits, respawnTime } = settings.player

export class Avionce extends Player2D {
  constructor() {
    super('armies/avionce.gif', { skalar: .75, zapaljiv: true, senka: true, buttonDict: { attack: '💥', special: '💣' } })
    this.brzina = 0
    this.poeni = 0
    this.zivoti = lives
    this.bombs = bombs
    this.specialHeld = false
    Object.assign(this, praviPucanje({ potisakMetka: 1000, vremePunjenja: .1, ugloviPucanja: [-.33, 0, .33] }))
  }

  onload() {
    this.postavi(platno.width / 2, platno.height - this.visina)
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
  }

  /** A heavy blow to every enemy plane around the player: fighters and heavy planes go down, the boss is hurt. */
  dropBomb() {
    if (!this.bombs) return

    this.bombs--
    createSound('explosion.mp3').play()
    this.ciljevi
      .filter(plane => plane.alive && this.razmakDo(plane) < bombRadius * Math.min(platno.width, platno.height))
      .forEach(plane => {
        plane.damage(bombHits)
        this.scoreIfDown(plane)
      })
  }

  scoreIfDown(plane) {
    if (plane.dead) this.poeni += plane.points
  }

  reset() {
    this.alive = true
    this.scaleX = this.scaleY = 1
  }

  umri() {
    this.alive = false
    this.pada = true
    this.zivoti--
    after(respawnTime, () => {
      this.pada = false
      if (this.zivoti) this.reset()
    })
  }

  update(dt, t) {
    super.update(dt, t)
    this.ciljevi.forEach(plane => this.proveriPogodak(plane, () => this.scoreIfDown(plane)))

    if (this.pada)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }
}
