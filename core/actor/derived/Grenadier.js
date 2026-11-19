import Player2D from '/core/actor/Player2D.js'
import Sprite from '/core/actor/Sprite.js'
import GrenadierSprite from './GrenadierSprite.js'
import Sound from '/core/io/audio/SoundSource.js'

export default class Grenadier extends Player2D {

  constructor({ x = 100, y = 100 } = {}) {
    super(null, { x, y, width: 66, height: 72 })
    this.sprite = new GrenadierSprite()
    const spatial = { getPosition: () => this.position }
    this.stepSound = new Sound('footstep-gravel-01.mp3', { variants: ['footstep-gravel-02.mp3', 'footstep-gravel-03.mp3', 'footstep-gravel-04.mp3'], profile: 'footstep', spatial })
    this.hitSound = new Sound('body-impact-01.mp3', { profile: 'impact', spatial })
    this.sounds.push(this.stepSound, this.hitSound)
    this.audioStepDistance = 0
    this.sprite.position = this.position
    this.thrust = 75
    this.frictionFactor = 0.3
    this.blood = new Sprite('sprites/efekti/krv-mala.png', {
      names: ['prska'], frameCount: 8, animationTime: .4,
    })
    this.blood.hide()
    this.children.push(this.sprite, this.blood)
    this.position.z = -1
  }

  takeHit() {
    if (this.alive) this.hitSound.play()
    super.die()
    this.blood.setAnimation('prska', false)
    this.blood.show()
  }

  update(dt) {
    const beforeX = this.x, beforeY = this.y
    super.update(dt)
    if (this.alive && dt > 0) {
      this.audioStepDistance += Math.hypot(this.x - beforeX, this.y - beforeY)
      if (this.audioStepDistance >= 35) {
        this.audioStepDistance %= 35
        this.stepSound.play()
      }
    }
    const moving = this.input.left || this.input.right || this.input.up || this.input.down
    this.sprite.animate = this.alive
    this.sprite.movement = Boolean(moving)
    this.sprite.walkSpeed = this.speed
    this.sprite.visible = this.visible
    this.blood.x = this.x + 5
    this.blood.y = this.y - 10
  }

  // The child sprite draws the player; the parent keeps movement and collision bounds.
  render() {}
}
