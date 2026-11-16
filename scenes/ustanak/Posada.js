import Sprite from '/core/actor/Sprite.js'
import artFrame from './artFrame.js'
import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'

const clips = { idle: 1.4, load: .75, fire: .32, recoil: .55 }

export default class Posada extends Sprite {
  constructor(x, y, { italian = false, direction = 1 } = {}) {
    super(`armies/game-ready/artiljerija/${italian ? 'italijanska' : 'partizanska'}-posada-sprites.png`, {
      x, y, width: 60, height: 60,
      names: Object.keys(clips), frameCount: 4, defaultAnimation: 'idle', animationTime: clips.idle,
    })
    this.pocetniX = x
    this.pocetniY = y
    this.direction = direction
  }

  play(name) {
    if (this.animation?.name === name) return
    this.animationTime = clips[name]
    this.setAnimation(name, name === 'idle')
  }

  handleInput() {
    if (['fire', 'recoil'].includes(this.animation?.name)) return
    if (keyboard.isDown(keys.shoot)) this.play('load')
    else this.play('idle')
  }

  fire() {
    this.play('fire')
  }

  resetRound() {
    this.play('idle')
    this.animationElapsed = 0
    this.x = this.pocetniX
    this.standAt(0)
  }

  standAt(depth) {
    this.y = this.pocetniY + depth
  }

  update(dt) {
    if (this.animation && this.animationFinished(dt))
      if (this.animation.name === 'fire') this.play('recoil')
      else if (this.animation.name === 'recoil') this.play('idle')

    super.update(dt)
  }

  drawFrame() {
    artFrame(this, { footOffset: 26, baseline: .965, direction: this.direction })
  }
}
