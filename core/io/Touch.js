import { hasBlockingUi } from './inputContext.js'
import { icons } from './icons.js'

const css = /* css */`
  .joystick, .button-container {
    position: fixed;
    bottom: var(--edge);
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
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
    background: var(--touch-fill);
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--touch-size);
    width: var(--touch-size);
    border: var(--touch-border);
    outline: var(--touch-outline);
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }
  .joystick-btn:hover,
  .game-btn:hover,
  .joystick-btn:active,
  .game-btn:active {
    background: var(--touch-pressed);
  }
  .joystick-btn {
    border-radius: var(--radius);
    transition: all 0.1s ease;
  }
  .game-btn {
    border-radius: 50%;
  }
  .joystick-btn .icon-art, .game-btn .icon-art {
    width: 85%;
    height: 85%;
  }
  .button-container {
    display: flex;
    right: var(--edge);
    gap: var(--edge);
  }
  /* beside the arrows, buttons that do not fit in one row wrap into rows above, so the two never overlap */
  .joystick ~ .button-container {
    flex-wrap: wrap-reverse;
    justify-content: flex-end;
    max-width: calc(100vw - var(--edge) * 3 - var(--touch-size) * 3 - 8px);
  }
  /* what stands in the same corner, as the second player's controls, goes above the touch buttons, however many rows they take */
  .button-container ~ .bottom-right {
    bottom: calc(var(--edge) * 2 + var(--touch-buttons-height, var(--touch-size)) + 8px);
  }
`

const arrowsData = [
  { key: 'up', row: 1, col: 2 },
  { key: 'down', row: 2, col: 2 },
  { key: 'left', row: 2, col: 1 },
  { key: 'right', row: 2, col: 3 }
]

/** The game buttons a touch screen can show, in their order; a game names the icon of each, the jump has its own. */
const buttonKeys = ['jump', 'attack', 'attack2', 'special']
const defaultIcons = { jump: icons.jump }

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
    element.innerHTML = icons[data.key]
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
    this.buttonsResize = new ResizeObserver(this.fitCorner)
    this.buttonsResize.observe(this.buttonContainer)

    Object.keys(buttonDict)
      .filter(key => buttonKeys.includes(key))
      .forEach(key => this.addButton(key, buttonDict[key] || defaultIcons[key] || ''))
  }

  addButton(key, icon) {
    const element = document.createElement('button')
    element.innerHTML = icon
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
    element.addEventListener('blur', () => {
      held.clear(); update()
    })
    element.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation()
    })
    // a held button is a long press, which opens the browser's menu instead of moving on
    element.addEventListener('contextmenu', e => e.preventDefault())
  }

  /** Tells the corner how tall the buttons are now, as their rows change with the screen width. */
  fitCorner = ([entry]) => {
    document.documentElement.style.setProperty('--touch-buttons-height', `${entry.contentRect.height}px`)
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
    this.buttonsResize?.disconnect()
    document.documentElement.style.removeProperty('--touch-buttons-height')
    this.buttonContainer?.remove()
    this.style?.remove()
  }
}
