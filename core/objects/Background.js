import { canvas2d, ctx } from '../io/canvas2d.js'
import { assets } from '/config.js'

export default class Background {
  constructor(src) {
    this.image = new Image()
    this.image.src = assets.images + src
    this.image.onload = () => {
      this.onload()
    }
  }

  onload() {}

  render() {
    ctx.drawImage(this.image, 0, 0, canvas2d.width, canvas2d.height)
  }
}
