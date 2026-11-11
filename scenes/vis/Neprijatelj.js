import Pokretno from './Pokretno.js'
import { randomInRange } from '/core/utils.js'
import { praviPucanje } from '/core/actor/prosirenja/pucanje.js'
import { after } from '/core/timers.js'

export default class Neprijatelj extends Pokretno {
  constructor(src, { potisak }) {
    super(src, {
      skalar: .66, odrazX: -1, zapaljiv: true, senka: true,
      potisak: potisak * randomInRange(1.1, 1.4), faktorY: randomInRange(3, 5),
    })
    Object.assign(this, praviPucanje({
      vremePunjenja: .1, ugloviPucanja: [-.33, 0, .33], potisakMetka: 600, stankaPucanja: 2
    }))
    this.pada = false
  }

  puca() {
    const poz = { x: this.x, y: this.y + this.visina / 4 }
    this.pali(poz, Math.PI * .5)
  }

  reset() {
    super.reset()
    this.alive = true
    this.scaleX = this.scaleY = 1
  }

  umri() {
    this.alive = false
    this.pada = true
    after(2, () => {
      this.pada = false
      this.reset()
    })
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.alive)
      this.rafalPovremeno(t)

    this.proveriPogotke()

    if (this.pada)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }
}
