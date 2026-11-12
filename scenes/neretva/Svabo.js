import Predmet from '/core/actor/Predmet.js'
import mish from '/core/io/mish.js'
import { createSound, randomVolume } from '/core/io/sound.js'

const rafal = createSound('rafal.mp3')
const slikaPuca = '/assets/images/armies/nemac-rov-puca.gif'

export default class Svabo extends Predmet {

  constructor({ skalar, ucestalost = 0.03, callback }) {
    super ('armies/rov-prazan.gif', { skalar })
    this.ucestalost = ucestalost
    this.callback = callback
    rafal.volume = randomVolume()
    this.init()
  }

  init() {
    this.stoji = false
    this.aimElapsed = 0
    this.vremeNisanjenja = 2.5
    this.slikaGore = 'armies/nemac-rov.gif'
    this.slikaDole = 'armies/rov-prazan.gif'
  }

  povremenoUstaje(dt) {
    if (!this.stoji && Math.random() < this.ucestalost * dt)
      this.ustani()
  }

  stav(bul) {
    this.stoji = bul
    const slika = bul ? this.slikaGore : this.slikaDole
    this.postaviSliku(slika)
    if (bul) this.aimElapsed = 0
  }

  ustani() {
    this.stav(true)
  }

  padni() {
    this.stav(false)
  }

  puca() {
    // setting the same src again reloads the image on every frame
    if (!this.slika.src.endsWith(slikaPuca)) this.slika.src = slikaPuca
  }

  jePogodjen() {
    return this.stoji && mish.iznad(this)
  }

  jeSpreman() {
    if (!this.stoji) return false
    return this.aimElapsed >= this.vremeNisanjenja
  }

  ubrzaj(n) {
    this.ucestalost *= n
  }

  update(dt) {
    super.update(dt)
    this.povremenoUstaje(dt)
    if (this.stoji) this.aimElapsed += dt
    if (this.jeSpreman()) {
      this.puca()
      rafal.play()
      this.callback(10, dt)
    }
  }
}
