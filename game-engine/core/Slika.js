import Kompozit from '/game-engine/core/Kompozit.js'
import { ctx } from '../io/platno.js'
import {pitagora} from '../utils.js'

export default class Slika extends Kompozit {
  #ugao = 0
  #odrazY = 1
  #odrazX = 1

  constructor(src, { sirina, visina, x = 200, y = 200, skalar = 1 } = {}) {
    super(x, y)
    this.slika = new Image()
    this.sirina = sirina
    this.visina = visina

    this.slika.onload = () => {
      if (!sirina && !visina) {
        this.sirina = this.slika.naturalWidth * skalar
        this.visina = this.slika.naturalHeight * skalar
      } else if (sirina && !visina)
        this.visina = (sirina / this.slika.naturalWidth) * this.slika.naturalHeight
      else if (!sirina && visina)
        this.sirina = (visina / this.slika.naturalHeight) * this.slika.naturalWidth
      this.onload()
      this.slika.onload = null
    }
    this.slika.src = src
    this.debug = false
    this.centrira = true
  }

  onload() {} // implementiraju naslednici

  zameniSliku(src) {
    this.slika.src = src
  }

  /* POLOZAJ */

  polozaj(x, y) {
    this.x = x
    this.y = y
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

  get ugaoStepeni() {
    return this.ugao * 180 / Math.PI
  }

  set ugaoStepeni(ugaoRadijani) {
    this.ugao = ugaoRadijani * Math.PI / 180
  }

  /* VELICINA */

  velicina(sirina, visina) {
    this.sirina = sirina
    this.visina = visina
  }

  prevelicaj(procenat) {
    this.sirina *= procenat
    this.visina *= procenat
  }

  get dijagonala() {
    return pitagora(0, this.sirina, 0, this.visina)
  }

  /* ODRAZ */

  get odrazY() {
    return this.#odrazY
  }

  set odrazY(bul) {
    this.#odrazY = bul ? -1 : 1
  }

  get odrazX() {
    return this.#odrazX
  }

  set odrazX(bul) {
    this.#odrazX = bul ? -1 : 1
  }

  /* LOOP */

  crtaOblik() {
    ctx.fillStyle = 'black'
    if (this.centrira)
      ctx.fillRect(-this.sirina / 2, -this.visina / 2, this.sirina, this.visina)
    else
      ctx.fillRect(0, 0, this.sirina, this.visina)
  }

  crtaSliku() {
    if (this.centrira)
      ctx.drawImage(this.slika, -this.sirina / 2, -this.visina / 2, this.sirina, this.visina)
    else
      ctx.drawImage(this.slika, 0, 0, this.sirina, this.visina)
  }

  render() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.ugao)
    ctx.scale(this.odrazY, this.odrazX)
    if (this.debug)
      this.crtaOblik()
    else
      this.crtaSliku()
    ctx.restore()
  }

  update() {
    this.render()
  }
}
