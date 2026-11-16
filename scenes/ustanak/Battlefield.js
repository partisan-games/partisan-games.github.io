import { assets } from '/config.js'
import PozadinaGrada from '/scenes/tenkici/PozadinaGrada.js'
import VillageFire from './VillageFire.js'
import imageReady from '/core/io/imageReady.js'

const villageGroundRatio = .806

const image = src => {
  const result = new Image()
  result.src = assets.images + src
  return result
}

/** Background only: every battlefield shares the same flat firing line. */
export default class Battlefield {
  constructor({ canvas, groundY, wind }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.groundY = groundY
    this.wind = wind
    this.time = 0
    this.mountains = image('background/planine.png')
    this.village = image('background/crnogorsko-selo-1941-pixel.png')
    this.villageFire = new VillageFire()
    // The city artwork's street begins at 395/543 of its height.
    this.cityViewport = { width: canvas.width, height: groundY * 543 / 395, getContext: () => this.ctx }
    this.city = new PozadinaGrada(this.cityViewport)
  }

  loaded() {
    return Promise.all([this.mountains, this.village, this.city.image].map(img => imageReady(img)))
  }

  update(dt) {
    this.time += dt
    this.city.update(dt)
  }

  landscape() {
    const { ctx, canvas, groundY } = this
    const sky = ctx.createLinearGradient(0, 0, 0, groundY)
    sky.addColorStop(0, '#698d9d')
    sky.addColorStop(1, '#c4ccbe')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (this.mountains.complete && this.mountains.naturalWidth) {
      ctx.save()
      ctx.filter = 'saturate(20%) sepia(25%) brightness(1.8)'
      ctx.drawImage(this.mountains, 0, groundY * .3, canvas.width, groundY * .7)
      ctx.restore()
    }
    ctx.fillStyle = '#9b9c83'
    ctx.fillRect(0, groundY - 10, canvas.width, canvas.height - groundY + 10)
    ctx.fillStyle = '#737d5e'
    ctx.fillRect(0, groundY - 10, canvas.width, 10)
  }

  render(round) {
    this.ctx.save()
    this.ctx.imageSmoothingEnabled = false
    if (round === 2 && this.village.complete && this.village.naturalWidth) {
      const { naturalWidth: width, naturalHeight: height } = this.village
      const horizon = height * villageGroundRatio
      // Align the painted street with the physical ground without cropping the sky or leaving a gap below it.
      this.ctx.drawImage(this.village, 0, 0, width, horizon, 0, 0, this.canvas.width, this.groundY)
      this.ctx.drawImage(this.village, 0, horizon, width, height - horizon,
        0, this.groundY, this.canvas.width, this.canvas.height - this.groundY)
      const effects = this.villageFire.canvas
      this.villageFire.render(this.time, this.wind ? this.wind.drift * effects.width / this.canvas.width : undefined)
      this.ctx.drawImage(effects, 0, 0, effects.width, effects.height * villageGroundRatio,
        0, 0, this.canvas.width, this.groundY)
    } else if (round === 3 && this.city.image.complete && this.city.image.naturalWidth) {
      this.cityViewport.width = this.canvas.width
      this.city.render(undefined, this.wind ? this.wind.drift * this.city.efekti.width / this.canvas.width : undefined)
    } else this.landscape()
    this.ctx.restore()
  }
}
