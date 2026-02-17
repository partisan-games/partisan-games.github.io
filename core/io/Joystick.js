const spacing = '16px'
const btnSize = '66px'

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
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
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
    font-size: 1.85rem;
  }
  .button-container {
    display: flex;
    left: 50%;
    transform: translateX(-50%);
    gap: ${spacing};
  }
`

const arrowsData = [
  { icon: '▲', key: 'up', row: 1, col: 2 },
  { icon: '▼', key: 'down', row: 2, col: 2 },
  { icon: '◀', key: 'left', row: 2, col: 1 },
  { icon: '▶', key: 'right', row: 2, col: 3 }
]

const buttonsData = {
  jump: '↑',
  attack: '🗡️',
  attack2: '⚔️',
  special: '💥',
}

export default class Joystick {
  constructor({ buttonDict }) {
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

    if (buttonDict)
      this.addGameButtons(buttonDict)
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
    const handleEvent = (val, e) => {
      e.preventDefault()
      this[key] = val
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