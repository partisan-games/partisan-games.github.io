import { platno, ctx } from './io/platno.js'
import { ishodista } from './konstante.js'

const poravnajNiz = niz => niz.flatMap(predmet =>
  [predmet, ...(predmet.predmeti ? poravnajNiz(predmet.predmeti) : [])]
)

export default class Renderer2D {
  constructor() {
    if (Renderer2D.instance) return Renderer2D.instance
    Renderer2D.instance = this

    this.kameraX = this.kameraY = 0 // TODO: integriši sa kamerom
  }

  clear({ pozadina, bojaPozadine } = {}) {
    if (pozadina)
      pozadina.render()
    else if (bojaPozadine) {
      ctx.fillStyle = bojaPozadine
      ctx.fillRect(0, 0, platno.width, platno.height)
    } else
      ctx.clearRect(0, 0, platno.width, platno.height)
  }

  crtaOblik(predmet) {
    ctx.fillStyle = 'black'
    if (predmet.ishodiste === ishodista.centar)
      ctx.fillRect(-predmet.sirina / 2, -predmet.visina / 2, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.goreLevo)
      ctx.fillRect(0, 0, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.doleDesno)
      ctx.fillRect(-predmet.sirina, -predmet.visina, predmet.sirina, predmet.visina)
  }

  crtaSliku(predmet) {
    if (predmet.ishodiste === ishodista.centar)
      ctx.drawImage(predmet.slika, -predmet.sirina / 2, -predmet.visina / 2, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.goreLevo)
      ctx.drawImage(predmet.slika, 0, 0, predmet.sirina, predmet.visina)
    else if (predmet.ishodiste === ishodista.doleDesno)
      ctx.drawImage(predmet.slika, -predmet.sirina, -predmet.visina, predmet.sirina, predmet.visina)
  }

  dodajSenku(predmet) {
    if (predmet.senka) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowOffsetX = 10
      ctx.shadowOffsetY = 10
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0)'
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }

  crtaPredmet(predmet) {
    if (!predmet.prikazan) return
    this.dodajSenku(predmet)

    ctx.save()
    ctx.translate(predmet.x, predmet.y)
    ctx.rotate(predmet.ugao)
    ctx.scale(predmet.odrazY, predmet.odrazX)
    ctx.scale(predmet.scaleX, predmet.scaleY)

    if (!predmet.slika || predmet.debug)
      this.crtaOblik(predmet)
    else
      this.crtaSliku(predmet)

    ctx.restore()
    if (predmet.zapaljen) predmet.plamen.render(predmet.zadimljen)
  }

  crtaPredmete(predmeti) {
    ctx.save()
    ctx.translate(-this.kameraX, -this.kameraY)

    poravnajNiz(predmeti)
      .sort((a, b) => b.polozaj?.z - a.polozaj?.z)
      .forEach(predmet => predmet.render ? predmet.render() : this.crtaPredmet(predmet))

    ctx.restore()
  }
}
