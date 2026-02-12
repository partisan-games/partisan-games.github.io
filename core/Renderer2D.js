import { ishodista } from './konstante.js'

const poravnajNiz = niz => niz.flatMap(predmet =>
  [predmet, ...(predmet.predmeti ? poravnajNiz(predmet.predmeti) : [])]
)

export default class Renderer2D {
  constructor({ canvas }) {
    if (Renderer2D.instance) return Renderer2D.instance
    Renderer2D.instance = this

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.kameraX = this.kameraY = 0
  }

  clear({ pozadina, bojaPozadine } = {}) {
    if (pozadina)
      pozadina.render()
    else if (bojaPozadine) {
      this.ctx.fillStyle = bojaPozadine
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    } else
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  crtaOblik(predmet) {
    this.ctx.fillStyle = 'black'
    if (predmet.ishodiste === ishodista.centar)
      this.ctx.fillRect(-predmet.sirina / 2, -predmet.visina / 2, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.goreLevo)
      this.ctx.fillRect(0, 0, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.doleDesno)
      this.ctx.fillRect(-predmet.sirina, -predmet.visina, predmet.sirina, predmet.visina)
  }

  crtaSliku(predmet) {
    if (predmet.ishodiste === ishodista.centar)
      this.ctx.drawImage(predmet.slika, -predmet.sirina / 2, -predmet.visina / 2, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.goreLevo)
      this.ctx.drawImage(predmet.slika, 0, 0, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.doleDesno)
      this.ctx.drawImage(predmet.slika, -predmet.sirina, -predmet.visina, predmet.sirina, predmet.visina)
  }

  dodajSenku(predmet) {
    if (predmet.senka) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      this.ctx.shadowOffsetX = 10
      this.ctx.shadowOffsetY = 10
    }
  }

  crtaPredmet(predmet) {
    if (!predmet.prikazan) return

    this.ctx.save()
    this.dodajSenku(predmet)
    this.ctx.translate(predmet.x, predmet.y)
    this.ctx.rotate(predmet.ugao)
    this.ctx.scale(predmet.odrazY, predmet.odrazX)
    this.ctx.scale(predmet.scaleX, predmet.scaleY)

    if (!predmet.slika || predmet.debug)
      this.crtaOblik(predmet)
    else
      this.crtaSliku(predmet)

    this.ctx.restore()
    if (predmet.zapaljen) predmet.plamen.render(predmet.zadimljen)
  }

  crtaPredmete(predmeti) {
    this.ctx.save()
    this.ctx.translate(-this.kameraX, -this.kameraY)

    poravnajNiz(predmeti)
      .sort((a, b) => b.polozaj?.z - a.polozaj?.z)
      .forEach(predmet => predmet.render ? predmet.render() : this.crtaPredmet(predmet))

    this.ctx.restore()
  }
}
