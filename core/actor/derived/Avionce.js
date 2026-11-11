import Player2D from '/core/actor/Player2D.js'
import platno from '/core/io/platno.js'
import { praviPucanje } from '/core/actor/prosirenja/pucanje.js'
import { after } from '/core/timers.js'
import { createSound } from '/core/io/sound.js'

const BOMBS = 2
const bombRadius = () => Math.min(platno.width, platno.height) * .5

export class Avionce extends Player2D {
  constructor() {
    super('armies/avionce.gif', { skalar: .75, zapaljiv: true, senka: true, buttonDict: { attack: '💥', special: '💣' } })
    this.brzina = 0
    this.poeni = 0
    this.zivoti = 3
    this.bombs = BOMBS
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

  /** Every enemy plane around the player goes down. */
  dropBomb() {
    if (!this.bombs) return

    this.bombs--
    createSound('explosion.mp3').play()
    this.ciljevi
      .filter(plane => plane.alive && this.razmakDo(plane) < bombRadius())
      .forEach(plane => {
        plane.umri()
        this.poeni++
      })
  }

  reset() {
    this.alive = true
    this.scaleX = this.scaleY = 1
  }

  umri() {
    this.alive = false
    this.pada = true
    this.zivoti--
    after(2.5, () => {
      this.pada = false
      if (this.zivoti) this.reset()
    })
  }

  update(dt, t) {
    super.update(dt, t)
    this.proveriPogotke(() => this.poeni++)

    if (this.pada)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }
}
