import Sound from '/core/io/audio/SoundSource.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import Occupier from '/core/actor/Occupier.js'
import mouse from '/core/io/mouse.js'
import { progresBar } from '/ui/components.js'
import Health from '/core/gameplay/Health.js'

export default class OtpisaniScene extends Scene2D {
  constructor() {
    super({
      intro: 'Kill all the occupiers!<br>Liberation is near.',
    })
  }

  init() {
    // The stationary gunner's world position is a model point, independent of the aim cursor.
    this.player = { position: { x: this.width * .5, y: this.height * .95 }, sounds: [] }
    this.player.shotSound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.player.shotSound)
    this.health = new Health()
    this.background = new Background('background/rusevine-varsava.jpg')
    this.audio = new Sound('otpisani.mp3', { stream: true, profile: 'music', loop: true })
    this.player.sounds.push(this.audio)
    this.spawnElapsed = 0
    this.dodajNeprijatelja()
    mouse.showCrosshair(this.player.shotSound)
    this.intervalIzlaska = 3000
    this.poeni = 0
  }

  dodajNeprijatelja() {
    this.add(new Occupier({ callback: dt => this.health.damage(dt * 5) }))
  }

  get energija() {
    return this.health.current
  }

  handleClick(e) {
    if (e.target.closest('button') || this.ui.ended || this.ui.outro) return
    this.children.forEach(svabo => svabo.checkHit(() => this.poeni++))
    this.audio.setPlaying(true)
  }

  end() {
    super.end()
    mouse.hideCrosshair()
    this.audio.stop()
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
