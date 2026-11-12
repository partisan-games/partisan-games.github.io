import { nasumicnoOkruglo } from '/core/utils.js'
import Predmet from '/core/actor/Predmet.js'
import { createSound } from '/core/io/sound.js'

const zvuciTraganje = ['eatdirtpig.wav', 'killthepig.wav', 'QuicklyQuickly.wav', 'schnell.wav', 'UpThere.wav', 'whereishe.wav']
const zvuciNadjen = ['Stop.wav', 'StopStayWhereYouAre.wav', 'thereheis.wav']

export default class Patrola extends Predmet {
  constructor(src = 'armies/nemci-patrola.gif', target) {
    super(src)
    this.brzina = 90
    this.talkElapsed = 0
    this.turnElapsed = 0
    this.ended = false
    this.target = target // opciono, za jačinu zvuka
    this.brojac
    this.zvuk
  }

  proveriGranice() {
    this.kruzi()
  }

  skreci() {
    if (this.brzina === 0) return
    if (this.turnElapsed < .3) return

    const nasumicno = Math.random() * Math.PI / 2 - Math.PI / 4
    this.skreni(nasumicno)
    this.turnElapsed = 0
  }

  pustiNasumicno(zvuci) {
    if (this.ended) return
    if (this.zvuk && !this.zvuk.paused) return

    const fajl = zvuci[nasumicnoOkruglo(0, zvuci.length - 1)]
    this.zvuk = createSound(`patrola/${fajl}`)
    const sound = this.zvuk
    sound.addEventListener('canplaythrough', () => {
      if (!this.ended) sound.play()
    }, { once: true })
    this.zvuk.load()
  }

  pricaj() {
    if (this.talkElapsed < 8) return
    this.pustiNasumicno(zvuciTraganje)
    this.talkElapsed = 0
  }

  pustiNadjen() {
    this.pustiNasumicno(zvuciNadjen)
  }

  update(dt) {
    super.update(dt)
    this.talkElapsed += dt
    this.turnElapsed += dt
    this.skreci()
    this.pricaj()
  }

  end() {
    this.ended = true
    this.zvuk?.pause()
  }
}
