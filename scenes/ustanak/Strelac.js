import Sprite from '/core/actor/Sprite.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import artFrame from './artFrame.js'
import Sound from '/core/io/audio/SoundSource.js'
import ustanakArt from '/core/actor/ustanakArt.js'

const art = ustanakArt.rifleman

/** Seconds between two shots of a firing rifleman, and the length of his standing and shooting animations. */
export const rifle = { interval: 3, idle: art.durations.idle, fire: art.durations.fire }

/**
 * The rifleman stands with his rifle, or fires it again and again. Each lasts until he is set to another; who does
 * it, and when, is up to the world.
 */
const states = {
  idle: {
    enter: soldier => soldier.stand(),
  },
  fire: {
    enter: soldier => {
      soldier.shotElapsed = 0
    },
    update: (soldier, dt) => {
      soldier.shotElapsed += dt
      if (soldier.shotElapsed >= rifle.interval && soldier.animation) {
        soldier.shotElapsed %= rifle.interval
        soldier.shoot()
      } else if (soldier.animation?.name === 'fire' && soldier.animationFinished(dt)) soldier.stand()
    },
  },
}

export default class Strelac extends Sprite {
  constructor(x, y) {
    super(art.src, {
      x, y, width: art.width, height: art.height, names: art.names, frameCount: art.columns,
      defaultAnimation: art.defaultAnimation, animationTime: rifle.idle,
    })
    this.shotElapsed = 0
    this.baseY = y
    this.shotSound = new Sound('rifle.mp3', { volume: .25, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
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

  standAt(depth) {
    this.y = this.baseY + depth
  }

  stand() {
    this.animationTime = rifle.idle
    this.setAnimation('idle', true)
  }

  shoot() {
    this.animationTime = rifle.fire
    this.setAnimation('fire', false)
    this.shotSound.play()
  }

  /** A new round starts his rifle's rhythm and his stance anew, in whatever state he is. */
  resetRound() {
    this.shotSound.stop()
    this.shotElapsed = 0
    this.stand()
    this.animationElapsed = 0
  }

  update(dt) {
    this.machine.update(dt)
    super.update(dt)
  }

  drawFrame() {
    artFrame(this, { footOffset: art.footOffset, baseline: art.baseline })
  }
}
