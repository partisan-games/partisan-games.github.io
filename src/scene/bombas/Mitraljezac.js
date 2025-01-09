import Predmet from '/game-engine/core/Predmet.js'
import { praviAutoPucanje } from '/game-engine/core/prosirenja/autoPucanje.js'

export default class Mitraljezac extends Predmet {
  constructor(x, y, cilj) {
    super('2d-bocno/nemci/mitraljezac-01.png', { x, y, ishodiste: 'DOLE_DESNO' })
    this.cilj = cilj
  }

  update(dt, t) {
    super.update(dt, t)
    this.ugao = this.ugaoKa(this.cilj) + Math.PI
    this.rafalPovremeno(t)
  }
}

const autoPucanje = praviAutoPucanje({
  zastoj: 3, kolicina: 50, src: 'granata.gif', skalar: .4, potisak: 600, y: -10
})

Object.assign(Mitraljezac.prototype, autoPucanje)