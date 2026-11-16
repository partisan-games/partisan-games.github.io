import Sprite from '/core/actor/Sprite.js'
import canvas2d, { ctx } from '/core/io/canvas2d.js'
import mouse from '/core/io/mouse.js'
import { randomInRange } from '/core/utils.js'
import { createSound, randomVolume } from '/core/io/sound.js'

const rafal = createSound('rafal.mp3')

export default class Occupier extends Sprite {
  constructor({ callback } = {}) {
    super ('sprites/vojnici/okupator-sprite.png', {
      names: ['nagore', 'nadole', 'nalevo', 'nadesno', 'umire'], frameCount: 5, width: 50, height: 180
    })
    this.y = canvas2d.height * .75
    this.callback = callback
    this.shootingImage = new Image()
    this.shootingImage.src = '/assets/images/pucanje.png'
    this.hasFired = false
    this.walked = 0
    this.walkTime = randomInRange(700, 3200)
    this.walk()
  }

  walk() {
    const izlaziLevo = Math.random() > .5
    this.x = izlaziLevo ? 0 : canvas2d.width
    this.defaultAnimation = izlaziLevo ? 'nadesno' : 'nalevo'
    this.speed = izlaziLevo ? 200 : -200
  }

  fire(dt) {
    this.setAnimation('nadole', false)
    this.stop()
    rafal.volume = randomVolume()
    rafal.play()
    this.hasFired = true
    if (this.callback) this.callback(dt)
  }

  checkHit(callback) {
    if (this.dead || !mouse.isOver(this)) return
    this.die()
    if (callback) callback()
  }

  die() {
    super.die()
    this.hasFired = false
    this.setAnimation('umire', false)
  }

  render() {
    super.render()
    if (this.hasFired)
      ctx.drawImage(this.shootingImage, this.x - 15, this.y - 25)
  }

  update(dt, t) {
    super.update(dt, t)
    if (!this.alive) return

    this.walked += dt
    if (this.walked * 1000 > this.walkTime)
      this.fire(dt)
  }
}
