import Scena2D from '/core/Scena2D.js'
import { platno } from '/core/io/platno.js'

export default class MainMenu extends Scena2D {
  constructor(manager) {
    super(manager, { showControls: false })
  }

  start() {
    super.start()
    platno.style.display = 'none'
  }

  handleClick(e) {
    const target = e.target.closest('.js-start')
    if (target?.classList.contains('js-start'))
      this.manager.start(target.value)
  }

  handleInput() {}

  handleVisibilityChange() {}
}