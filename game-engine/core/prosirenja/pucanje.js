import Metak from '/game-engine/core/projektili/Metak.js'
import Vreme from '/game-engine/core/Vreme.js'

export function praviPucanje({
  projektil = Metak, vremePunjenja = 100, ugloviPucanja = [0], potisakMetka = 1000, zastoj = 3,
  gravitacija = 0, src, skalar
} = {}) {
  return {
    meci: [],
    ciljevi: [],
    vreme: new Vreme(),
    zapoceto: false,
    // automatsko
    zadnjiInterval: 0,
    zastoj, // sekundi

    novMetak() {
      const metak = new projektil({ gravitacija, src, skalar })
      this.meci.push(metak)
      this.predmeti.push(metak)
      return metak
    },

    pali(polozaj, ugao, potisak = potisakMetka) {
      if (this.zapoceto && this.vreme.proteklo <= vremePunjenja) return

      ugloviPucanja.forEach(ofset => {
        const metak = this.meci.find(g => !g.vidljiv) || this.novMetak()
        metak.pali(polozaj, ugao + ofset, potisak)
      })
      this.vreme.reset()
      this.zapoceto = true
    },

    proveriPogodak(cilj, callback) {
      if (!cilj.prikazan || cilj.mrtav) return

      this.meci.forEach(metak => {
        if (!metak.prikazan) return

        metak.proveriPogodak(cilj, callback)
      })
    },

    proveriPogotke(callback) {
      this.ciljevi.forEach(cilj => this.proveriPogodak(cilj, callback))
    },

    /* CILJANO */

    pucaCiljano() {
      if (!this.ciljevi.some(cilj => cilj.ziv)) return

      const meta = this.traziNajblizuMetu()
      if (!meta) return

      this.pali(this.polozaj, this.ugaoKa(meta))
    },

    traziNajblizuMetu() {
      let minRazmak
      let najblizaMeta
      this.ciljevi.forEach(cilj => {
        const razmak = this.razmakDo(cilj)
        if (!minRazmak) minRazmak = razmak
        if (!najblizaMeta) najblizaMeta = cilj
        if (razmak < minRazmak) minRazmak = razmak
      })
      return najblizaMeta
    },

    /* AUTOMATSKO */

    pucaPovremeno(t) {
      if (t - this.zadnjiInterval > this.zastoj) {
        this.pucaCiljano()
        this.zadnjiInterval = t
      }
    },

  }
}
