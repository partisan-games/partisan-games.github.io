import Metak from '/game-engine/core/projektili/Metak.js'
import Vreme from '/game-engine/core/Vreme.js'

export function praviPucanje({ pauzaPaljbe = 100, ugloviPucanja = [-13, 0, 13] } = {}) {
  return {
    meci: [],
    ciljevi: [],
    vreme: new Vreme(),
    ugaoPucanja: Math.PI * 1.5,

    novMetak() {
      const metak = new Metak()
      this.meci.push(metak)
      this.predmeti.push(metak)
      return metak
    },

    puca() {
      if (this.vreme.proteklo <= pauzaPaljbe) return
      const polozaj = { x: this.x, y: this.y - this.visina / 4 }

      ugloviPucanja.forEach(ugao => {
        const metak = this.meci.find(g => !g.vidljiv) || this.novMetak()
        metak.pali(polozaj, this.ugaoPucanja + ugao)
      })
      this.vreme.reset()
    },

    proveriPogotke(callback) {
      this.ciljevi.forEach(neprijatelj => {
        if (neprijatelj.nijeVidljiv || neprijatelj.mrtav) return

        this.meci.forEach(metak => {
          if (metak.nijeVidljiv) return

          if (metak.sudara(neprijatelj)) {
            neprijatelj.umri()
            metak.reset()
            if (callback) callback()
          }
        })
      })
    }
  }
}
