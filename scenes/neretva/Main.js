import mish from '/core/io/mish.js'
import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import Svabo from './Svabo.js'
import Vreme from '/core/Vreme.js'

const DALJI_Y = window.innerHeight * 0.25
const BLIZI_Y = window.innerHeight * 0.5

export default class extends Scena2D {
  constructor() {
    super({ intro: 'Zadrži Nemce po svaku cenu, dok ranjenici ne budu na bezbednom.', showControls: false })
  }

  init() {
    this.pogoci = 0
    this.rekord = 0
    this.energija = 100
    this.preostaloVreme = 120
    this.ubrzano = false
    this.bliziRovovi = this.praviSvabe(10, BLIZI_Y, { skalar: 1, ucestalost: 0.03, callback: this.nanesiStetu.bind(this) })
    this.daljiRovovi = this.praviSvabe(12, DALJI_Y, { skalar: .5, ucestalost: 0.02, callback: this.nanesiStetu.bind(this) })
    this.sveSvabe = [...this.daljiRovovi, ...this.bliziRovovi]
    this.add(...this.sveSvabe)
    this.pozadina = new Pozadina('textures/terrain/suva-trava.jpg')
    this.vreme = new Vreme()
    this.ucitajRekord()
    mish.dodajNishan()
  }

  praviSvabe(n, y, params) {
    const razmak = this.sirina / n
    const polaRazmaka = razmak / 2
    return Array.from({ length: n }, (_, i) => {
      const x = i * razmak + polaRazmaka
      const svabo = new Svabo(params)
      svabo.postavi(x, y)
      return svabo
    })
  }

  handleClick(e) {
    super.handleClick(e)
    if (this.energija <= 0) return

    const ciljaniRovovi = (mish.y <= DALJI_Y) ? this.daljiRovovi : this.bliziRovovi
    this.proveriPogotke(ciljaniRovovi)
  }

  nanesiStetu(damage, dt) {
    this.energija = Math.max(0, this.energija - damage * dt)
  }

  proveriPogotke(neretva) {
    for (let i = 0; i < neretva.length; i++)
      if (neretva[i].jePogodjen()) {
        neretva[i].padni()
        this.pogoci++
      }
  }

  smrt() {
    let poruka = 'Hrabro si pao. '
    if (this.pogoci > this.rekord) {
      poruka += `Ubio si ${this.pogoci} okupatora. To je novi rekord!`
      localStorage.setItem('svabeRekord', this.pogoci)
    }
    this.defeat(poruka)
  }

  ucitajRekord() {
    this.rekord = parseInt(localStorage.getItem('svabeRekord'))
    if (!this.rekord) this.rekord = 0
  }

  end() {
    super.end()
    mish.ukloniNishan()
  }

  update(dt) {
    if (this.energija <= 0) return

    if (Math.ceil(this.preostaloVreme) < 1)
      return this.victory('Odbranio si položaj, ranjenici su spašeni.')

    this.preostaloVreme -= dt

    super.update(dt)
    if (!this.ubrzano && this.preostaloVreme < 60) {
      this.sveSvabe.forEach(svabo => svabo.ubrzaj(2))
      this.ubrzano = true
    }
    if (this.energija <= 0) this.smrt()
  }

  sceneUI() {
    const energija = Math.round(this.energija)

    return /* html */`
    ${this.ui.scoreUI('Poeni', this.pogoci, 'Evakuacija za', Math.ceil(this.preostaloVreme))}
    <progress class="progress top-right" value="${energija}" max='100'></progress>
    `
  }
}
