import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'

const zvuciTraganje = ['eatdirtpig.mp3', 'killthepig.mp3', 'QuicklyQuickly.mp3', 'schnell.mp3', 'UpThere.mp3', 'whereishe.mp3']
const zvuciNadjen = ['Stop.mp3', 'StopStayWhereYouAre.mp3', 'thereheis.mp3']

export default class Patrola extends GameObject2D {
  constructor(src = 'armies/nemci-patrola.gif', target) {
    super(src)
    this.speed = 90
    this.talkElapsed = 0
    this.turnElapsed = 0
    this.ended = false
    this.target = target // opciono, za jačinu zvuka
    this.counter
    const speech = files => new Sound(`patrola/${files[0]}`, { variants: files.slice(1).map(file => `patrola/${file}`), profile: 'speech', follow: true, spatial: { getPosition: () => this.position } })
    this.searchVoice = speech(zvuciTraganje)
    this.foundVoice = speech(zvuciNadjen)
    this.sounds.push(this.searchVoice, this.foundVoice)
    this.zvuk = null
  }

  checkBounds() {
    this.wrapAround()
  }

  skreci() {
    if (this.speed === 0) return
    if (this.turnElapsed < .3) return

    const nasumicno = Math.random() * Math.PI / 2 - Math.PI / 4
    this.turn(nasumicno)
    this.turnElapsed = 0
  }

  pustiNasumicno(zvuci) {
    if (this.ended) return
    if (this.zvuk?.playing) return

    this.zvuk = zvuci === zvuciTraganje ? this.searchVoice : this.foundVoice
    this.zvuk.play()
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
    this.sounds.forEach(sound => sound.stop())
  }
}
