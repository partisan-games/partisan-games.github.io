import { hasBlockingUi } from './inputContext.js'
import { icons } from './icons.js'

const btnSize = '60px'

const css = /* css */`
  .joystick, .button-container {
    position: fixed;
    bottom: var(--edge);
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    z-index: var(--z-top);
  }
  .joystick {
    left: var(--edge);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 4px;
  }
  .joystick-btn, .game-btn {
    background: rgba(126, 126, 126, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${btnSize};
    width: ${btnSize};
    border: 2px solid white;
    outline: 2px solid black;
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }
  .joystick-btn:hover,
  .game-btn:hover,
  .joystick-btn:active,
  .game-btn:active {
    background: rgba(0, 0, 0, 0.5);
  }
  .joystick-btn {
    border-radius: 8px;
    font-size: 2.5rem;
    font-weight: bold;
    transition: all 0.1s ease;
  }
  .game-btn {
    border-radius: 50%;
    font-size: 1.75rem;
  }
  .button-container {
    display: flex;
    right: var(--edge);
    gap: var(--edge);
  }
  /* a camera button or meter in the same corner goes above the touch buttons instead of under them */
  .button-container ~ .bottom-right {
    bottom: calc(var(--edge) * 2 + ${btnSize} + 8px);
  }
`

const arrowsData = [
  { icon: '▲', key: 'up', row: 1, col: 2 },
  { icon: '▼', key: 'down', row: 2, col: 2 },
  { icon: '◀', key: 'left', row: 2, col: 1 },
  { icon: '▶', key: 'right', row: 2, col: 3 }
]

const buttonsData = {
  jump: icons.jump,
  attack: icons.attack,
  attack2: icons.attack2,
  special: icons.special,
}

export default class Touch {
  constructor({ useJoystick, buttonDict }) {
    this.up = false
    this.down = false
    this.left = false
    this.right = false
    this.jump = false
    this.attack = false
    this.attack2 = false
    this.special = false
    this.presses = new Map()
    window.addEventListener('blur', this.reset)
    document.addEventListener('visibilitychange', this.reset)
    document.addEventListener('game-input-reset', this.reset)

    this.style = document.createElement('style')
    this.style.textContent = css
    document.head.appendChild(this.style)

    if (useJoystick)
      this.addJoystick()

    if (buttonDict)
      this.addGameButtons(buttonDict)
  }

  get controlsPressed() {
    return this.up || this.down || this.left || this.right
  }

  get keyPressed() {
    return this.controlsPressed || this.jump || this.attack || this.attack2 || this.special
  }

  addJoystick() {
    this.joystick = document.createElement('div')
    this.joystick.className = 'joystick'

    arrowsData.forEach(data => this.addArrow(data))
    document.body.appendChild(this.joystick)
  }

  addArrow(data) {
    const element = document.createElement('button')
    element.className = 'joystick-btn'
    element.innerText = data.icon
    Object.assign(element.style, {
      gridRow: data.row,
      gridColumn: data.col,
    })

    this.addBtnEvents(element, data.key)
    this.joystick.appendChild(element)
  }

  addGameButtons(buttonDict) {
    this.buttonContainer = document.createElement('div')
    this.buttonContainer.className = 'button-container'
    document.body.appendChild(this.buttonContainer)

    Object.keys(buttonDict)
      .filter(key => key in buttonsData)
      .forEach(key => this.addButton(key, buttonDict[key] || buttonsData[key]))
  }

  addButton(key, icon) {
    const element = document.createElement('button')
    element.innerText = icon
    element.classList.add('game-btn')

    this.addBtnEvents(element, key)
    this.buttonContainer.appendChild(element)
  }

  addBtnEvents = (element, key) => {
    const held = new Set()
    this.presses.set(element, { key, held })
    const update = () => {
      this[key] = [...this.presses.values()].some(item => item.key === key && item.held.size)
    }
    const pointer = (down, e) => {
      if (down && hasBlockingUi()) return
      e.preventDefault()
      e.stopPropagation()
      if (down) held.add(e.pointerId ?? 'pointer')
      else held.delete(e.pointerId ?? 'pointer')
      update()
    }

    element.addEventListener('pointerdown', e => pointer(true, e))
    for (const type of ['pointerup', 'pointerleave', 'pointercancel'])
      element.addEventListener(type, e => pointer(false, e))
    element.addEventListener('keydown', e => {
      if (!['Space', 'Enter'].includes(e.code) || hasBlockingUi()) return
      e.preventDefault()
      e.stopPropagation()
      held.add(e.code)
      update()
    })
    element.addEventListener('keyup', e => {
      if (!['Space', 'Enter'].includes(e.code)) return
      e.preventDefault()
      e.stopPropagation()
      held.delete(e.code)
      update()
    })
    element.addEventListener('blur', () => { held.clear(); update() })
    element.addEventListener('click', e => { e.preventDefault(); e.stopPropagation() })
  }

  reset = () => {
    for (const { key, held } of this.presses.values()) {
      held.clear()
      this[key] = false
    }
  }

  end() {
    this.reset()
    window.removeEventListener('blur', this.reset)
    document.removeEventListener('visibilitychange', this.reset)
    document.removeEventListener('game-input-reset', this.reset)
    this.joystick?.remove()
    this.buttonContainer?.remove()
    this.style?.remove()
  }
}
