import { platno } from '../io/platno.js'
import { sudar } from '../utils/sudari.js'
import {
  izasaoDole, izasaoGore, izasaoDesno, izasaoLevo, izasaoLevoSkroz, izasaoDesnoSkroz, vanEkrana
} from '/core/utils/granice.js'
import Vector from '../Vector.js'
import { ishodista } from '../konstante.js'

export default class Predmet {
  #ugao = 0

  constructor(src, {
    sirina, visina, x = 200, y = 200, z = 0, skalar = 1, brzina = 0, zapaljiv = false, ishodiste = ishodista.centar,
    odrazY = 1, odrazX = 1, scaleX = 1, scaleY = 1, senka = false, debug = false, ziv = true, zadimljen = false
  } = {}) {
    this.polozaj = new Vector(x, y, z)
    if (src) this.ucitajSliku(src, sirina, visina, skalar)
    else {
      this.sirina = sirina || 10
      this.visina = visina || 10
    }
    this.brzina = brzina
    this.zapaljiv = zapaljiv
    this.ishodiste = ishodiste
    this.odrazY = odrazY
    this.odrazX = odrazX
    this.scaleX = scaleX
    this.scaleY = scaleY
    this.senka = senka
    this.debug = debug
    this.ziv = ziv
    this.zadimljen = zadimljen
    this.vidljiv = true
    this.oznake = new Set()
    this.predmeti = []
  }

  ucitajSliku(src, sirina, visina, skalar) {
    this.sirina = sirina
    this.visina = visina
    this.slika = new Image()
    this.slika.onload = () => {
      this.dodeliVelicinu(sirina, visina, skalar)
      this.onload()
    }
    this.slika.src = '/assets/images/' + src
  }

  onload() {} // za naslednike

  zameniSliku(src) {
    this.slika.src = src
  }

  /* VELICINA */

  dodeliVelicinu = (sirina, visina, skalar) => {
    if (!sirina && !visina) {
      this.sirina = this.slika.naturalWidth * skalar
      this.visina = this.slika.naturalHeight * skalar
    } else if (sirina && !visina)
      this.visina = (sirina / this.slika.naturalWidth) * this.slika.naturalHeight
    else if (!sirina && visina)
      this.sirina = (visina / this.slika.naturalHeight) * this.slika.naturalWidth
  }

  get dijagonala() {
    return Math.hypot(this.sirina, this.visina)
  }

  /* POLOZAJ */

  get x() {
    return this.polozaj.x
  }

  set x(val) {
    this.polozaj.x = val
  }

  get y() {
    return this.polozaj.y
  }

  set y(val) {
    this.polozaj.y = val
  }

  postavi(x, y, z) {
    this.polozaj.set({ x, y, z })
  }

  tlo(y) {
    this.y = y - this.visina / 2
  }

  /* UGAO */

  get ugao() {
    return this.#ugao
  }

  set ugao(noviUgao) {
    this.#ugao = (noviUgao + Math.PI * 2) % (Math.PI * 2)
  }

  skreni(noviUgao) {
    this.ugao = noviUgao
    this.brzina = this.brzina // ažurira pravac kretanja
  }

  ugaoKa(cilj) {
    return Math.atan2(cilj.y - this.y, cilj.x - this.x)
  }

  /* KRETANJE */

  get brzina() {
    return Math.hypot(this.dx, this.dy)
  }

  set brzina(velicina) {
    this.dx = velicina * Math.cos(this.ugao)
    this.dy = velicina * Math.sin(this.ugao)
  }

  dodajSilu(velicina, ugao = this.ugao) {
    this.dx += velicina * Math.cos(ugao)
    this.dy += velicina * Math.sin(ugao)
  }

  trenje(faktorTrenja = 0.1) {
    const modifikator = 1 - faktorTrenja
    this.dx *= modifikator
    this.dy *= modifikator
  }

  stani() {
    this.brzina = 0
  }

  /* STANJE */

  get prikazan() {
    return this.vidljiv && !this.vanEkrana
  }

  get mrtav() {
    return !this.ziv
  }

  pokazi() {
    this.vidljiv = true
  }

  sakrij() {
    this.vidljiv = false
  }

  nestani() {
    this.sakrij()
    this.stani()
  }

  umri() {
    this.stani()
    this.ziv = false
  }

  /* KOLIZIJA */

  sudara(predmet) {
    if (!this.vidljiv || !predmet.vidljiv) return false
    return sudar(this, predmet)
  }

  razmakDo(predmet) {
    return this.polozaj.razmakDo(predmet.polozaj)
  }

  /* GRANICE */

  get vanEkrana() {
    return vanEkrana(this)
  }

  proveriGranice() {}

  kruzi() {
    if (izasaoLevoSkroz(this)) this.x = platno.width + this.sirina / 2
    if (izasaoDesnoSkroz(this)) this.x = 0
    if (izasaoDole(this)) this.y = 0
    if (izasaoGore(this)) this.y = platno.height
  }

  vracaVodoravno(callback) {
    if (!izasaoLevoSkroz(this)) return

    this.x = platno.width + this.sirina / 2
    if (callback) callback()
  }

  odbija() {
    if (izasaoGore(this) || izasaoDole(this))
      this.skreni(2 * Math.PI - this.ugao)
    if (izasaoLevo(this) || izasaoDesno(this))
      this.skreni(Math.PI - this.ugao)
  }

  ogranici() {
    this.ograniciVodoravno()
    this.ograniciUspravno()
  }

  ograniciVodoravno() {
    const marginaLevo = this.sirina / 4
    const marginaDesno = platno.width - marginaLevo
    if (this.x <= marginaLevo) this.x = marginaLevo
    if (this.x >= marginaDesno) this.x = marginaDesno
  }

  ograniciUspravno() {
    const marginaGore = this.visina / 2
    const marginaDole = platno.height - marginaGore
    if (this.y <= marginaGore) this.y = marginaGore
    if (this.y >= marginaDole) this.y = marginaDole
  }

  /* PLAMEN */

  set zapaljiv(bul) {
    if (bul) import('./Plamen.js')
      .then(module => {
        this.plamen = new module.default()
      })
  }

  get zapaljiv() {
    return Boolean(this.plamen)
  }

  get zapaljen() {
    return this.zapaljiv && this.mrtav
  }

  /* DEBUG */

  log(name) {
    if (name && this.constructor.name !== name) return

    const x = this.x.toFixed()
    const y = this.y.toFixed()
    const sirina = this.sirina?.toFixed()
    const visina = this.visina?.toFixed()
    const dx = this.dx.toFixed()
    const dy = this.dy.toFixed()
    const brzina = this.brzina.toFixed()
    const ugao = this.ugao.toFixed(2)
    console.log(`${this.constructor.name} x: ${x}, y: ${y}, sirina: ${sirina}, visina: ${visina}, dx: ${dx}, dy: ${dy}, brzina: ${brzina}, ugao: ${ugao}, vidljiv: ${this.vidljiv}, ziv: ${this.ziv}`)
  }

  /* LOOP */

  azurirajKretanje(dt) {
    if (!this.dx && !this.dy) return

    this.x += this.dx * dt
    this.y += this.dy * dt
  }

  azurirajPlamen(dt) {
    if (!this.zapaljen) return

    this.plamen.x = this.x
    this.plamen.y = this.y

    this.plamen.update(dt)
  }

  update(dt) {
    if (dt === undefined) console.error(this.constructor.name, 'ne prosleđuje delta time.', dt)

    this.azurirajKretanje(dt)
    this.proveriGranice()
    this.azurirajPlamen(dt)
  }
}
