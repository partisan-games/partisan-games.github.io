import Predmet from '/core/actor/Predmet.js'
import Vreme from '/core/Vreme.js'
import mish from '/core/io/mish.js'

const rafal = new Audio('/assets/sounds/rafal.mp3')

export default class Svabo extends Predmet {

  constructor({ skalar, ucestalost = 0.03, callback }) {
    super ('armies/rov-prazan.gif', { skalar })
    this.ucestalost = ucestalost
    this.callback = callback
    this.init()
  }

  init() {
    this.stoji = false
    this.vreme = new Vreme()
    this.vremeNisanjenja = 2.5
    this.slikaGore = '/assets/images/armies/nemac-rov.gif'
    this.slikaDole = '/assets/images/armies/rov-prazan.gif'
  }

  povremenoUstaje(dt) {
    if (!this.stoji && Math.random() < this.ucestalost * dt)
      this.ustani()
  }

  stav(bul) {
    this.stoji = bul
    const slika = bul ? this.slikaGore : this.slikaDole
    this.zameniSliku(slika)
    if (bul) this.vreme.reset()
  }

  ustani() {
    this.stav(true)
  }

  padni() {
    this.stav(false)
  }

  puca() {
    this.slika.src = '/assets/images/armies/nemac-rov-puca.gif'
  }

  jePogodjen() {
    return this.stoji && mish.iznad(this)
  }

  jeSpreman() {
    if (!this.stoji) return false
    return this.vreme.protekloSekundi >= this.vremeNisanjenja
  }

  ubrzaj(n) {
    this.ucestalost *= n
  }

  update(dt) {
    super.update(dt)
    this.povremenoUstaje(dt)
    if (this.jeSpreman()) {
      this.puca()
      rafal.play()
      this.callback(10, dt)
    }
  }
}
