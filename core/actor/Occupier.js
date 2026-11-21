import Sprite from '/core/actor/Sprite.js'
import { ctx } from '/core/io/canvas2d.js'
import mouse from '/core/io/mouse.js'
import Sound from '/core/io/audio/SoundSource.js'
import StateMachine from '/core/gameplay/StateMachine.js'

/** An occupier's walking pace in pixels per second. */
export const occupier = { speed: 200 }

/**
 * The occupier walks the way he faces, or stands and fires his burst at the viewer every frame, or lies fallen. Each
 * lasts until he is set to another.
 */
const states = {
  walk: {
    enter: soldier => {
      soldier.defaultAnimation = soldier.heading > 0 ? 'nadesno' : 'nalevo'
      soldier.setAnimation(soldier.defaultAnimation)
      soldier.speed = soldier.heading * occupier.speed
    },
  },
  fire: {
    enter: soldier => {
      soldier.setAnimation('fire', true)
      soldier.stop()
      soldier.hasFired = true
    },
    update: (soldier, dt) => {
      soldier.burstSound.play()
      soldier.callback?.(dt)
    },
  },
  dead: {
    enter: soldier => {
      if (soldier.alive) soldier.die()
      soldier.hasFired = false
      soldier.setAnimation('umire', false)
    },
  },
}

/** An occupier seen from the front, who walks across and fires at the viewer, who shoots him with the mouse. */
export default class Occupier extends Sprite {
  /** `heading` is the way he walks: 1 right, -1 left; `callback(dt)` is called each frame he fires. */
  constructor({ x, y, heading = 1, callback } = {}) {
    super('armies/game-ready/vojnici/occupier-sprites.png', {
      names: ['nagore', 'nadole', 'nalevo', 'nadesno', 'umire', 'fire'], frameCount: 5, width: 50, height: 180, x, y,
    })
    this.heading = heading
    this.callback = callback
    this.shootingImage = new Image()
    this.shootingImage.src = '/assets/images/pucanje.png'
    this.burstSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
    this.hasFired = false
    this.machine = new StateMachine(this, states, 'walk')
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

  /** The way he faces: 1 right, -1 left. */
  get forward() {
    return this.heading
  }

  checkHit(callback) {
    if (this.dead || !mouse.isOver(this)) return
    this.die()
    if (callback) callback()
  }

  die() {
    if (this.dead) return
    super.die()
    this.machine.set('dead')
  }

  render() {
    super.render()
    if (this.hasFired)
      ctx.drawImage(this.shootingImage, this.x - 15, this.y - 25)
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.alive) this.machine.update(dt)
  }
}
