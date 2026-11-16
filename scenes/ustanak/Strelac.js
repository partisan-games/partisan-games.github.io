import Sprite from '/core/actor/Sprite.js'
import artFrame from './artFrame.js'

export default class Strelac extends Sprite {
  constructor(x, y) {
    super('armies/game-ready/vojnici/partizanski-strelac-sprites.png', {
      x, y, width: 88, height: 80, names: ['idle', 'fire'], frameCount: 4,
      defaultAnimation: 'idle', animationTime: 1.4,
    })
    this.shotElapsed = 0
  }

  resetRound() {
    this.shotElapsed = 0
    this.animationTime = 1.4
    this.setAnimation('idle', true)
    this.animationElapsed = 0
  }

  update(dt) {
    this.shotElapsed += dt
    if (this.shotElapsed >= 3 && this.animation) {
      this.shotElapsed %= 3
      this.animationTime = .4
      this.setAnimation('fire', false)
    } else if (this.animation?.name === 'fire' && this.animationFinished(dt)) {
      this.animationTime = 1.4
      this.setAnimation('idle', true)
    }
    super.update(dt)
  }

  drawFrame() {
    artFrame(this, { footOffset: 26, baseline: .85 })
  }
}
