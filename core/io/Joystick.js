const css = /* css */`
  .joystick {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 180px;
    height: 180px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    user-select: none;
    touch-action: none;
    z-index: 9;
  }

  .joystick-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    font-size: 32px;
    font-weight: bold;
    transition: all 0.1s ease;
  }

  .game-btn {
    background: rgba(126, 126, 126, 0.5);
    border-radius: 50%;
    border: 2px solid white;
    outline: 2px solid black;
    bottom: 8px;
    height: 60px;
    position: absolute;
    transform: translateX(-50%);
    width: 60px;
    padding: 0;
  }

  .special-btn {
    left: calc(50% - 190px);
  }

  .jump-btn {
    left: calc(50% - 100px);
  }

  .attack-btn {
    left: calc(50% + 100px);
  }

  .attack2-btn {
    left: calc(50% + 190px);
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

    if (animDict?.jump) this.addButton('jump', 'Jmp')
    if (animDict?.attack) this.addButton('attack', 'Atk')
    if (animDict?.attack2) this.addButton('attack2', 'Atk')
    if (animDict?.special) this.addButton('special', 'Spl')
  }

  addJoystick() {
    this.container = document.createElement('div')
    this.container.className = 'joystick'

    const buttons = [
      { text: '▲', row: 1, col: 2, dir: 'up' },
      { text: '▼', row: 3, col: 2, dir: 'down' },
      { text: '◀', row: 2, col: 1, dir: 'left' },
      { text: '▶', row: 2, col: 3, dir: 'right' }
    ]

    buttons.forEach(btn => {
      const button = document.createElement('button')
      button.className = 'joystick-button'
      button.innerText = btn.text

      Object.assign(button.style, {
        gridRow: btn.row,
        gridColumn: btn.col,
      })

      const setActive = active => {
        this[btn.dir] = active
        // button.style.background = active ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)'
        // button.style.transform = active ? 'scale(0.9)' : 'scale(1)'
      }

      button.addEventListener('pointerdown', e => {
        e.preventDefault()
        setActive(true)
      })

      button.addEventListener('pointerup', () => setActive(false))
      button.addEventListener('pointerleave', () => setActive(false))
      button.addEventListener('pointercancel', () => setActive(false))

      this.container.appendChild(button)
    })

    document.body.appendChild(this.container)
  }

  addButton(name, label = name) {
    const btn = document.createElement('button')
    btn.innerText = label
    btn.title = name
    btn.classList.add('game-btn', `${name}-btn`)
    document.body.appendChild(btn)

    btn.addEventListener('pointerdown', () => {
      this[name] = true
    })
    btn.addEventListener('pointerup', () => {
      this[name] = false
    })
  }

  end() {
    this.container.remove()
    document.querySelectorAll('.game-btn').forEach(el => el.remove())
  }
}