import Scena2D from '/core/Scena2D.js'
import { platno } from '/core/io/platno.js'
import { scenes } from './scenes.js'

function generateNonOverlappingCircles(n, r, width = window.innerWidth, height = window.innerHeight, margin = r) {
  const positions = []
  const centerX = width / 2
  const centerY = height / 2

  const effectiveWidth = width - 2 * margin
  const effectiveHeight = height - 2 * margin

  for (let i = 0; i < n; i++) {
    let placed = false
    let radius = r
    let attempts = 0

    while (!placed && attempts < 1000) { // ograničenje na 1000 pokušaja
      const angle = Math.random() * 2 * Math.PI
      const distance = radius + Math.random() * (Math.min(effectiveWidth, effectiveHeight) / 2 - radius)
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance

      if (x >= margin && x <= width - margin && y >= margin && y <= height - margin)
        if (!positions.some(p => Math.hypot(p.x - x, p.y - y) < 2 * r)) {
          positions.push({ x, y })
          placed = true
        } else
          radius += 1
      attempts++
    }

    if (attempts >= 1000) {
      console.warn(`Prekinuto generisanje nakon 1000 pokušaja za krug ${i + 1}.`)
      break
    }
  }
  return positions
}

const pozicije = generateNonOverlappingCircles(Object.keys(scenes).length - 1, 80)

const renderIcon = (key, data, i) => {
  const style = `"top: ${pozicije[i].y}px; left: ${pozicije[i].x}px;"`
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