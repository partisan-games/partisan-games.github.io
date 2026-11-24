import Scene2D from '/core/Scene2D.js'
import BattleView from './BattleView.js'

export default class BitkaScene extends Scene2D {
  constructor() {
    super({ showControls: false })
    this.backgroundColor = '#000'
    this.view = new BattleView(this.canvas)
    this.time = 0
  }

  init() {
    return this.view.init()
  }

  update(_delta, time) {
    this.time = time
  }

  render() {
    this.view.render(this.time)
  }
}
