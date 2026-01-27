import { nasumicnoOkruglo } from '/core/utils.js'
import Predmet from '/core/actor/Predmet.js'
import Vreme from '/core/Vreme.js'
import config from '/config.js'

const zvuciTraganje = ['eatdirtpig.wav', 'killthepig.wav', 'QuicklyQuickly.wav', 'schnell.wav', 'UpThere.wav', 'whereishe.wav']
const zvuciNadjen = ['Stop.wav', 'StopStayWhereYouAre.wav', 'thereheis.wav']

export default class Patrola extends Predmet {
  constructor(src = 'armies/nemci-patrola.gif', target) {
    super(src)
    this.brzina = 90
    this.vremePricanja = new Vreme()
    this.vremeSkretanja = new Vreme()
    this.target = target // opciono, za jačinu zvuka
    this.brojac
    this.zvuk
  }

  proveriGranice() {
    this.kruzi()
  }

  skreci() {
    if (this.brzina === 0) return
    if (this.vremeSkretanja.proteklo < 300) return

    const nasumicno = Math.random() * Math.PI / 2 - Math.PI / 4
    this.skreni(nasumicno)
    this.vremeSkretanja.reset()
  }

  pustiNasumicno(zvuci) {
    if (this.zvuk && !this.zvuk.paused) return

    const fajl = zvuci[nasumicnoOkruglo(0, zvuci.length - 1)]
    const src = `/assets/sounds/patrola/${fajl}`

    this.zvuk = new Audio(src)
    this.zvuk.volume = config.volume
    this.zvuk.addEventListener('canplaythrough', () => this.zvuk.play())
    this.zvuk.load()
  }

  pricaj() {
    if (this.vremePricanja.proteklo < 8000) return
    this.pustiNasumicno(zvuciTraganje)
    this.vremePricanja.reset()
  }

  pustiNadjen() {
    this.pustiNasumicno(zvuciNadjen)
  }

  update(dt) {
    super.update(dt)
    this.skreci()
    this.pricaj()
  }
}
