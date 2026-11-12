import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import Okupator from '/core/actor/Okupator.js'
import mish from '/core/io/mish.js'
import { progresBar } from '/ui/components.js'
import Health from '/core/gameplay/Health.js'
import { createSound } from '/core/io/sound.js'

export default class extends Scena2D {
  constructor() {
    super({
      intro: 'Kill all the occupiers!<br>Liberation is near.',
    })
  }

  init() {
    this.health = new Health()
    this.pozadina = new Pozadina('background/rusevine-varsava.jpg')
    this.audio = createSound('otpisani.mp3')
    this.spawnElapsed = 0
    this.dodajNeprijatelja()
    mish.dodajNishan()
    this.intervalIzlaska = 3000
    this.poeni = 0
  }

  dodajNeprijatelja() {
    this.predmeti.push(new Okupator({ callback: dt => this.health.damage(dt * 5) }))
  }

  get energija() {
    return this.health.current
  }

  handleClick(e) {
    super.handleClick(e)
    if (e.target.closest('button') || this.ui.ended || this.ui.outro) return
    this.predmeti.forEach(svabo => svabo.proveriPogodak(() => this.poeni++))
    this.audio.play()
  }

  end() {
    super.end()
    mish.ukloniNishan()
    this.audio.pause()
  }

  update(dt, t) {
    if (this.ui.outro) return
    super.update(dt, t)

    this.spawnElapsed += dt
    if (this.spawnElapsed * 1000 > Math.max(this.intervalIzlaska, 500)) {
      this.dodajNeprijatelja()
      this.spawnElapsed = 0
    }
    this.intervalIzlaska -= dt * 100

    if (this.energija === 0) this.defeat()
  }

  sceneUI() {
    return /* html */`
      <div class="top-left">
        Score: ${this.poeni} <br>
      </div>
      <div class="top-right">
        ${progresBar(this.energija)}
      </div>
    `
  }
}
