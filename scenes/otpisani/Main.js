import { keys, attackLabels } from '/core/io/keys.js'
import Sound from '/core/io/audio/SoundSource.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import Occupier from '/core/actor/Occupier.js'
import mouse from '/core/io/mouse.js'
import { progresBar } from '/ui/components.js'
import Health from '/core/gameplay/Health.js'
import { randomInRange } from '/core/utils.js'

export default class OtpisaniScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { [attackLabels.pointer]: 'shoot', [keys.pause.label]: 'pause' },
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
    /** How long each occupier still walking has walked, and how long he walks before he fires, in seconds. */
    this.walks = new Map()
    this.dodajNeprijatelja()
    mouse.showCrosshair(this.player.shotSound)
    this.intervalIzlaska = 3000
    this.poeni = 0
  }

  /** An occupier comes in from either side and walks for a while before he fires. */
  dodajNeprijatelja() {
    const walkTime = randomInRange(.7, 3.2)
    const fromLeft = Math.random() > .5
    const occupier = new Occupier({
      x: fromLeft ? 0 : this.width, y: this.height * .75, heading: fromLeft ? 1 : -1,
      callback: dt => this.health.damage(dt * 5),
    })
    this.walks.set(occupier, { walked: 0, walkTime })
    this.add(occupier)
  }

  /** Sets each occupier who has walked his while to fire; a fallen one walks no more. */
  attack(dt) {
    for (const [occupier, walk] of this.walks)
      if (occupier.dead) this.walks.delete(occupier)
      else if ((walk.walked += dt) > walk.walkTime) {
        occupier.setState('fire')
        this.walks.delete(occupier)
      }

  }

  get energija() {
    return this.health.current
  }

  handleClick(e) {
    if (this.session.state !== 'running' || this.ui.screen || this.ui.ended || this.ui.outro) return
    if (e.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    mouse.x = e.pageX
    mouse.y = e.pageY
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
    this.attack(dt)

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
