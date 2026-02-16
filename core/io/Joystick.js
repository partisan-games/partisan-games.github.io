const spacing = '16px'

const css = /* css */`
  .joystick, .button-container {
    position: fixed;
    bottom: ${spacing};
    user-select: none;
    touch-action: none;
    z-index: 9;
  }

  .joystick {
    left: ${spacing};
    height: 120px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
  }

  .button-container {
    display: flex;
    right: ${spacing};
    gap: ${spacing};
  }

  .joystick-btn, .game-btn {
    background: rgba(126, 126, 126, 0.25);
    border: 2px solid white;
    outline: 2px solid black;
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
    font-size: 32px;
    font-weight: bold;
    transition: all 0.1s ease;
  }

  .game-btn {
    border-radius: 50%;
    height: 60px;
    width: 60px;
    padding: 0;
    font-size: 1.5rem;
  }
`

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

    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)

    this.addJoystick()
    this.addGameButtons(animDict)
  }

  addJoystick() {
    this.joystick = document.createElement('div')
    this.joystick.className = 'joystick'

    const arrows = [
      { text: '▲', row: 1, col: 2, dir: 'up' },
      { text: '▼', row: 2, col: 2, dir: 'down' },
      { text: '◀', row: 2, col: 1, dir: 'left' },
      { text: '▶', row: 2, col: 3, dir: 'right' }
    ]

    arrows.forEach(btn => {
      const button = document.createElement('button')
      button.className = 'joystick-btn'
      button.innerText = btn.text

      Object.assign(button.style, {
        gridRow: btn.row,
        gridColumn: btn.col,
      })

      const setActive = active => {
        this[btn.dir] = active
      }

      button.addEventListener('pointerdown', e => {
        e.preventDefault()
        setActive(true)
      })

      button.addEventListener('pointerup', () => setActive(false))
      button.addEventListener('pointerleave', () => setActive(false))
      button.addEventListener('pointercancel', () => setActive(false))

      this.joystick.appendChild(button)
    })

    document.body.appendChild(this.joystick)
  }

  addGameButtons(animDict) {
    this.buttons = document.createElement('div')
    this.buttons.className = 'button-container'
    document.body.appendChild(this.buttons)

    if (animDict?.jump) this.addButton('jump', '↑')
    if (animDict?.attack) this.addButton('attack', '🗡️')
    if (animDict?.attack2) this.addButton('attack2', '⚔️')
    if (animDict?.special) this.addButton('special', '💥')
  }

  addButton(state, label = state) {
    const btn = document.createElement('button')
    btn.innerText = label
    btn.title = state
    btn.classList.add('game-btn')
    this.buttons.appendChild(btn)

    btn.addEventListener('pointerdown', () => {
      this[state] = true
    })
    btn.addEventListener('pointerup', () => {
      this[state] = false
    })
  }

  end() {
    this.joystick.remove()
    this.buttons.remove()
  }
}