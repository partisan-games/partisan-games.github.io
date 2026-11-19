import GameObject2D from '/core/actor/GameObject2D.js'
import { canvas2d } from '/core/io/canvas2d.js'
import { randomInRange } from '/core/utils.js'
import Sound from '/core/io/audio/SoundSource.js'

export default class Paljba extends GameObject2D {
  constructor() {
    super('items/krateri/krater.gif')
    this.postaviRandom()
    this.sounds.push(new Sound('explosion.mp3', { autoplay: true, profile: 'explosion', spatial: { getPosition: () => this.position } }))
  }

  randomX(marginaX) {
    this.x = randomInRange(marginaX, canvas2d.width - marginaX)
  }

  randomY(marginaY) {
    this.y = randomInRange(marginaY, canvas2d.height - marginaY)
  }

  postaviRandom(marginaX = 10, marginaY = 10) {
    this.randomX(marginaX)
    this.randomY(marginaY)
  }
}
