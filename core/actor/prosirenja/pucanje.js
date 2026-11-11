import Metak from '/core/actor/projektili/Metak.js'
import Vreme from '/core/Vreme.js'

export function praviPucanje({
  projektil = Metak, vremePunjenja = .1, ugloviPucanja = [0], potisakMetka = 1000, stankaPucanja = 3,
  gravitacija = 0, src, skalar, x = 0, y = 0,
} = {}) {
  return {
    meci: [],
    ciljevi: [],
    pripucao: false,
    cekanjePucanja: new Vreme(),
    zadnjePucanje: 0,
    ispaljenih: 0,
    duzinaRafala: 5,

    /* OSNOVNO */

    novMetak() {
      const metak = new projektil({ gravitacija, src, skalar })
      this.meci.push(metak)
      this.predmeti.push(metak)
      return metak
    },

    pali(poz, ugao, potisak = potisakMetka) {
      if (this.pripucao && this.cekanjePucanja.protekloSekundi <= vremePunjenja) return

      const tacanPolozaj = { x: poz.x + x, y: poz.y + y }

      ugloviPucanja.forEach(ofset => {
        const metak = this.meci.find(g => !g.vidljiv) || this.novMetak()
        metak.pali(tacanPolozaj, ugao + ofset, potisak)
      })
      this.cekanjePucanja.reset()
      this.pripucao = true
    },

    proveriPogodak(cilj, callback) {
      if (!cilj.prikazan || cilj.dead) return

      this.meci.forEach(metak => {
        if (!metak.prikazan || cilj.dead) return

        metak.proveriPogodak(cilj, callback)
      })
    },

    proveriPogotke(callback) {
      this.ciljevi.forEach(cilj => this.proveriPogodak(cilj, callback))
    },

    /* CILJANO */

    traziNajblizuMetu() {
      let minRazmak = Infinity
      let najblizaMeta
      this.ciljevi.forEach(cilj => {
        const razmak = this.razmakDo(cilj)
        if (cilj.alive && razmak < minRazmak) {
          minRazmak = razmak
          najblizaMeta = cilj
        }
      })
      return najblizaMeta
    },

    pucaCiljano() {
      if (!this.ciljevi.some(cilj => cilj.alive)) return
      const meta = this.traziNajblizuMetu()
      if (!meta) return

      this.pali(this.polozaj, this.ugaoKa(meta))
    },

    pucaPovremenoCiljano(t) {
      if (t - this.zadnjePucanje > stankaPucanja) {
        this.pucaCiljano()
        this.zadnjePucanje = t
      }
    },

    /* RAFALNO */

    rafalPovremeno(t, ciljano = false) {
      if (t - this.zadnjePucanje > stankaPucanja && this.cekanjePucanja.protekloSekundi > vremePunjenja) {

        if (ciljano)
          this.pucaCiljano()
        else
          this.puca()
        this.ispaljenih++
        this.cekanjePucanja.reset()

        if (this.ispaljenih >= this.duzinaRafala) {
          this.ispaljenih = 0
          this.zadnjePucanje = t
        }
      }
    },

    rafalPovremenoCiljano(t) {
      return this.rafalPovremeno(t, true)
    },
  }
}

export const praviRakete = ({ src = 'items/raketa.png', skalar = .55, potisakMetka = 500, ...rest } = {}) =>
  praviPucanje({ src, skalar, potisakMetka, ...rest })
