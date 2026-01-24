import Scena2D from '/core/Scena2D.js'
import { platno } from '/core/io/platno.js'
import scenes from './scenes.json' with { type: 'json' }
import { dodajProcente } from '/core/utils/geo.js'

dodajProcente(scenes)

const renderIcon = (key, data) => {
  const style = `"transform: translate(-50%, -50%); top: ${data.procenti.y * 100}%; left: ${data.procenti.x * 100}%;"`
  return /* html */`
    <button value='${key}' class='menu-btn js-start' style=${style}>
    <img src="/assets/images/${data.icon}" height="${data.height || 40}">
    <br>${data.name}
    </button>
  `
}

const renderIcons = dict => Object.entries(dict)
  .filter(([key]) => key != 'MainMenu')
  .filter(([key, value]) => value.procenti)
  .map(([key, value]) => renderIcon(key, value))
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
    if (target?.classList.contains('js-start'))
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