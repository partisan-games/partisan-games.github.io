import Sprite from '/core/actor/Sprite.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import artFrame from './artFrame.js'
import Sound from '/core/io/audio/SoundSource.js'

const clips = { idle: 1.4, load: .75, fire: .32, recoil: .55 }

/**
 * The crew stands by the gun, or loads it, or fires it: the shot and its recoil play once and the crew stands by
 * again. Who sets the crew to load or fire, and when, is up to the world.
 */
const states = {
  idle: {
    enter: crew => crew.play('idle'),
  },
  load: {
    enter: crew => crew.play('load'),
  },
  fire: {
    enter: crew => crew.play('fire'),
    update: crew => {
      if (crew.animation?.name === 'idle') crew.setState('idle')
    },
  },
}

export default class Posada extends Sprite {
  constructor(x, y, { italian = false, direction = 1 } = {}) {
    super(`armies/game-ready/artiljerija/${italian ? 'italijanska' : 'partizanska'}-posada-sprites.png`, {
      x, y, width: 60, height: 60,
      names: Object.keys(clips), frameCount: 4, defaultAnimation: 'idle', animationTime: clips.idle,
    })
    this.pocetniX = x
    this.pocetniY = y
    this.direction = direction
    this.loadSound = new Sound('cannon-load.mp3', { volume: .65, profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.loadSound)
    this.machine = new StateMachine(this, states, 'idle')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  play(name) {
    if (this.animation?.name === name) return
    this.animationTime = clips[name]
    this.setAnimation(name, name === 'idle')
    if (name === 'load') this.loadSound.play()
    else this.loadSound.stop()
  }

  fire() {
    this.setState('fire')
  }

  resetRound() {
    this.loadSound.stop()
    this.setState('idle')
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

    this.machine.update(dt)
    super.update(dt)
  }

  drawFrame() {
    artFrame(this, { footOffset: 26, baseline: .965, direction: this.direction })
  }
}
