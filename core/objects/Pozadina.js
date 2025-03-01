import { platno, ctx } from '../io/platno.js'

export default class Pozadina {
  constructor(src) {
    this.slika = new Image()
    this.slika.src = '/assets/images/' + src
    this.slika.onload = () => {
      this.onload()
    }
  }

  onload() {}

  render() {
    ctx.drawImage(this.slika, 0, 0, platno.width, platno.height)
  }
}
