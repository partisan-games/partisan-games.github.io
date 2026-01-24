import Scena2D from '/core/Scena2D.js'
import { platno } from '/core/io/platno.js'
import scenes from './scenes.json' with { type: 'json' }
import { dodajProcente } from '/core/utils/geo.js'

dodajProcente(scenes)

const renderIcon = (key, item) => /* html */`
  <button value='${key}' class='menu-item js-start'>
    <p>${item.name}</p>
    <img src="/assets/images/${item.icon}">
  </button>
`

const renderIcons = dict => Object.entries(dict)
  .filter(([key]) => key != 'MainMenu')
  .map(([key, value]) => renderIcon(key, value))
  .join('')

export default class MainMenu extends Scena2D {
  constructor(manager) {
    super(manager, { showControls: false })
    this.manuItems = renderIcons(scenes)
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
    return /* html */`
      <h1>Partisan Games ★</h1>
      <div class="main-menu">
        ${this.manuItems}
      </div>
    `
  }
}