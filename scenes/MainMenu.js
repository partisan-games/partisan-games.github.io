import Scena2D from '/core/Scena2D.js'
import { platno } from '/core/io/platno.js'
import { scenes } from './scenes.js'
import { getRandomCoords } from '/core/utils.js'

const coords = getRandomCoords({ fieldSize: 150, margin: 100, offSet: 50 })

const renderIcon = (key, data, i) => {
  const style = `"top: ${coords[i].y}px; left: ${coords[i].x}px;"`
  return /* html */`
    <button value='${key}' class='menu-btn js-start' style=${style}>
    <img src="/assets/images/${data.icon}" height="${data.height || 40}">
    <br>${data.name}
    </button>
  `
}

const renderIcons = dict => Object.entries(dict)
  .filter(([key]) => key != 'MainMenu')
  .map(([key, value], i) => renderIcon(key, value, i))
  .join('')

export default class MainMenu extends Scena2D {
  constructor(manager) {
    super(manager, { showControls: false })
    this.manuIcons = renderIcons(scenes)
  }

  start() {
    super.start()
    platno.style.display = 'none'
  }

  handleClick(e) {
    const target = e.target.closest('button')
    if (target.classList.contains('js-start'))
      this.manager.start(target.value)
  }

  handleInput() {}

  handleVisibilityChange() {}

  sceneUI() {
    return `
      <h1>Partisan Games ★</h1>
      ${this.manuIcons}
    `
  }
}