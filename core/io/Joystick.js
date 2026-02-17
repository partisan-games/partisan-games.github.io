const spacing = '16px'
const btnSize = 80

const css = /* css */`
  .joystick, .button-container {
    position: fixed;
    bottom: ${spacing};
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    z-index: 9;
  }
  .joystick {
    left: ${spacing};
    width: ${btnSize * 3}px;
    height: ${btnSize * 2}px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
  }
  .joystick-btn, .game-btn {
    background: rgba(126, 126, 126, 0.25);
    border: 2px solid white;
    outline: 2px solid black;
    -webkit-tap-highlight-color: transparent;
  }
  .joystick-btn:hover,
  .game-btn:hover,
  .joystick-btn:active,
  .game-btn:active {
    background: rgba(0, 0, 0, 0.5);
  }
  .joystick-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 2.5rem;
    font-weight: bold;
    transition: all 0.1s ease;
  }
  .button-container {
    display: flex;
    right: ${spacing};
    gap: ${spacing};
  }
  .game-btn {
    border-radius: 50%;
    height: ${btnSize}px;
    width: ${btnSize}px;
    padding: 0;
    font-size: 1.85rem;
  }
`

const arrowsDict = [
  { icon: '▲', field: 'up', row: 1, col: 2 },
  { icon: '▼', field: 'down', row: 2, col: 2 },
  { icon: '◀', field: 'left', row: 2, col: 1 },
  { icon: '▶', field: 'right', row: 2, col: 3 }
]

const buttonsDict = [
  { icon: '↑', field: 'jump' },
  { icon: '🗡️', field: 'attack' },
  { icon: '⚔️', field: 'attack2' },
  { icon: '💥', field: 'special' }
]

export default class Joystick {
  constructor({ animDict }) {
    this.up = false
    this.down = false
    this.left = false
    this.right = false
    this.jump = false
    this.attack = false
    this.attack2 = false
    this.special = false

    this.style = document.createElement('style')
    this.style.textContent = css
    document.head.appendChild(this.style)

    this.addJoystick()

    if (animDict)
      this.addGameButtons(animDict)
  }

  addJoystick() {
    this.joystick = document.createElement('div')
    this.joystick.className = 'joystick'

    arrowsDict.forEach(data => this.addArrow(data))
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

    this.addBtnEvents(element, data)
    this.joystick.appendChild(element)
  }

  addGameButtons(animDict) {
    this.buttonContainer = document.createElement('div')
    this.buttonContainer.className = 'button-container'
    document.body.appendChild(this.buttonContainer)

    buttonsDict.forEach(data => {
      if (data.field in animDict) this.addButton(data)
    })
  }

  addButton(data) {
    const element = document.createElement('button')
    element.innerText = data.icon
    element.title = data.field
    element.classList.add('game-btn')

    this.addBtnEvents(element, data)
    this.buttonContainer.appendChild(element)
  }

  addBtnEvents = (element, data) => {
    const handleEvent = (val, e) => {
      e.preventDefault()
      this[data.field] = val
    }

    element.addEventListener('pointerdown', e => handleEvent(true, e))
    element.addEventListener('pointerup', e => handleEvent(false, e))
    element.addEventListener('pointerleave', e => handleEvent(false, e))
    element.addEventListener('pointercancel', e => handleEvent(false, e))
  }

  end() {
    this.joystick?.remove()
    this.buttonContainer?.remove()
    this.style?.remove()
  }
}