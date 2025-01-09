import { keyboard } from '/game-engine/io/Keyboard.js'
import platno from '/game-engine/io/platno.js'
import Vreme from '/game-engine/core/Vreme.js'
import Predmet from '/game-engine/core/Predmet.js'
import Cev from './Cev.js'
import Granata from './Granata.js'
import { gravitacija } from './konstante.js'

const statickoTrenje = 0.3
const kinetickoTrenje = 0.1
const vremePunjenja = 1000
const vremePunjenjaAI = 1500

export default class Tenk extends Predmet {
  constructor(src = '/assets/slike/2d-bocno/partizanski-tenk-bez-cevi.png', { skalar = .05, tenkDesno = false, callback, ...rest } = {}) {
    super(src, { zapaljiv: true, skalar, ...rest })
    this.tenkDesno = tenkDesno
    this.cev = new Cev(this, '/assets/slike/2d-bocno/partizanski-tenk-cev.png', skalar)
    this.potisak = 25
    this.vreme = new Vreme()
    this.x = Math.random() * platno.width * 0.3
    this.ime = 'Partizanski tenk'
    this.spremno = false
    this.granate = this.praviGranate(10, callback)
    this.energija = 100
    this.zapaljivost = 20
    this.predmeti = [...this.granate]
    // if AI
    this.vremeGasa = new Vreme()
    this.vremeSmera = new Vreme()
    this.vremePucanja = new Vreme()
  }

  get zapaljen() {
    return this.energija <= this.zapaljivost
  }

  get polozajGranate() {
    const x = Math.cos(this.cev.ugao) * this.cev.dijagonala + this.cev.x
    const y = Math.sin(this.cev.ugao) * this.cev.dijagonala + this.cev.y
    return { x, y }
  }

  praviGranate(length, callback) {
    return Array.from({ length }, () => new Granata({ callback }))
  }

  skiniEnergiju(steta) {
    this.energija = Math.max(this.energija - steta, 0)
  }

  proveriSmrt() {
    if (this.energija <= 0) this.umri()
  }

  proveriPogodak(cilj) {
    this.granate
      .filter(granata => granata.ispaljena)
      .forEach(granata => granata.proveriPogodak(cilj))
  }

  proveriPucanje() {
    const key = this.tenkDesno ? 'enter' : 'space'
    if (keyboard[key]) this.spremno = true
    if (this.spremno && !keyboard[key]) {
      this.pucaj()
      this.spremno = false
    }
  }

  pucaj() {
    if (this.vreme.proteklo < vremePunjenja || !this.granate.length) return
    const granata = this.granate.find(g => !g.ispaljena)
    if (!granata) return

    granata.pucaj(this.polozajGranate, this.cev.ugao)
    this.trzaj()
    this.vreme.reset()
  }

  trzaj() {
    this.dodajSilu(this.potisak, this.ugao + Math.PI)
  }

  proveriGranice() {
    this.x = this.tenkDesno
      ? Math.min(Math.max(this.x, platno.width / 2), platno.width)
      : Math.min(Math.max(this.x, 0), platno.width / 2)
  }

  proveriTipke() {
    if (this.mrtav) return

    if (this.tenkDesno) {
      if (keyboard.pressed.ArrowLeft && this.x > platno.width / 2)
        this.dodajSilu(this.potisak, Math.PI)
      if (keyboard.pressed.ArrowRight && this.x < platno.width)
        this.dodajSilu(this.potisak * 0.6, 0)
      if (keyboard.pressed.ArrowUp)
        this.cev.nagore()
      if (keyboard.pressed.ArrowDown)
        this.cev.nadole()
    } else {
      if (keyboard.pressed.KeyA && this.x > 0)
        this.dodajSilu(this.potisak * 0.6, Math.PI)
      if (keyboard.pressed.KeyD && this.x < platno.width / 2)
        this.dodajSilu(this.potisak, 0)
      if (keyboard.pressed.KeyW)
        this.cev.nagore()
      if (keyboard.pressed.KeyS)
        this.cev.nadole()
    }

    this.proveriPucanje()
  }

  /* AI */

  nisani(predmet) {
    this.cev.ugao = Math.PI + this.razmakDo(predmet) / (gravitacija * gravitacija * 0.8)
  }

  mrdajNasumicno() {
    const random = Math.random()
    if (this.vremeGasa.proteklo > 70) {
      this.dodajSilu((random * this.potisak), this.smer)
      this.vremeGasa.reset()
    }
    if (this.vremeSmera.proteklo > 300) {
      this.smer = random > 0.55 ? Math.PI : 0
      this.vremeSmera.reset()
    }
    if (this.x > platno.width * 0.9) this.smer = 0
    if (this.x < platno.width / 2) this.smer = Math.PI
  }

  pucajNasumicno() {
    if (this.vremePucanja.proteklo < vremePunjenjaAI) return
    this.pucaj()
    this.vremePucanja.reset()
  }

  samohod(cilj) {
    if (this.mrtav) return
    this.mrdajNasumicno()
    if (cilj.mrtav) return
    this.nisani(cilj)
    this.pucajNasumicno()
  }

  /* LOOP */

  update(dt) {
    super.update(dt)
    this.cev.update(dt)
    this.trenje(this.brzina > 0.1 ? kinetickoTrenje : statickoTrenje)
    this.proveriSmrt()
  }

  render() {
    this.cev.render() // da cev ide iza plamena
    super.render()
  }
}
