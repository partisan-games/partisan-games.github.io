import Scene from './Scene.js'
import Renderer2D from './Renderer2D.js'
import { canvas2d } from '/core/io/canvas2d.js'

export default class Scene2D extends Scene {
  constructor({ canvas = canvas2d, ...params }) {
    super({ canvas, ...params })
    this.backgroundColor = null
    this.renderer = new Renderer2D({ canvas: this.canvas })
  }

  clear() {
    this.renderer.clear({ background: this.background, backgroundColor: this.backgroundColor })
  }

  render() {
    this.renderer.drawObjects(this.children)
  }
}
