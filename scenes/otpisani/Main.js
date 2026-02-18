import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import Okupator from '/core/actor/Okupator.js'
import mish from '/core/io/mish.js'
import { progresBar } from '/ui/components.js'
import { praviEnergiju } from '/core/actor/prosirenja/energija.js'
import Vreme from '/core/Vreme.js'

export default class extends Scena2D {
  constructor() {
    super({
      intro: 'Kill all the occupiers!<br>Liberation is near.',
    })
  }

  init() {
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(praviEnergiju()))
    this.pozadina = new Pozadina('background/rusevine-varsava.jpg')
    this.audio = new Audio('/assets/sounds/otpisani.mp3')
    this.vreme = new Vreme()
    this.dodajNeprijatelja()
    mish.dodajNishan()
    this.intervalIzlaska = 3000
    this.poeni = 0
  }

  dodajNeprijatelja() {
    this.predmeti.push(new Okupator({ callback: dt => this.skiniEnergiju(dt * 5) }))
  }

  handleClick(e) {
    super.handleClick(e)
    this.predmeti.forEach(svabo => svabo.proveriPogodak(() => this.poeni++))
    this.audio.play()
  }

  end() {
    super.end()
    mish.ukloniNishan()
    setTimeout(() => this.audio.pause(), 1) // klik na izlaz ponovo pušta
  }

  update(dt, t) {
    if (this.outro) return
    super.update(dt, t)

    if (this.vreme.proteklo > Math.max(this.intervalIzlaska, 500)) {
      this.dodajNeprijatelja()
      this.vreme.reset()
    }
    this.intervalIzlaska -= dt * 100

    if (this.energija === 0) this.defeat()
  }

  sceneUI() {
    return /* html */`
      <div class="top-left">
        Score: ${this.poeni} <br>
      </div>
      <div class="top-right">
        ${progresBar(this.energija)}
      </div>
    `
  }
}
