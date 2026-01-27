import Predmet from '/core/actor/Predmet.js'

export default class Mina extends Predmet {
  constructor(params) {
    super('items/nagazna.png', { skalar: .75, zapaljiv: true, ...params })
  }

  proveriSudar(telo) {
    if (this.sudara(telo)) {
      this.umri()
      telo.umri()
    }
  }
}