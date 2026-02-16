export default class Joystick {
  constructor() {
    this.up = false
    this.down = false
    this.left = false
    this.right = false

    this._initDom()
  }

  _initDom() {
    this.container = document.createElement('div')

    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '4px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '180px',
      height: '180px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      userSelect: 'none',
      touchAction: 'none',
      zIndex: 9,
    })

    const buttons = [
      { text: '▲', row: 1, col: 2, dir: 'up' },
      { text: '▼', row: 3, col: 2, dir: 'down' },
      { text: '◀', row: 2, col: 1, dir: 'left' },
      { text: '▶', row: 2, col: 3, dir: 'right' }
    ]

    buttons.forEach(btn => {
      const el = document.createElement('div')
      el.innerText = btn.text

      Object.assign(el.style, {
        gridRow: btn.row,
        gridColumn: btn.col,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        fontSize: '32px',
        fontWeight: 'bold',
        transition: 'all 0.1s ease'
      })

      const setActive = active => {
        this[btn.dir] = active
        el.style.background = active ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)'
        el.style.transform = active ? 'scale(0.9)' : 'scale(1)'
      }

      el.addEventListener('pointerdown', e => {
        e.preventDefault()
        setActive(true)
      })

      el.addEventListener('pointerup', () => setActive(false))
      el.addEventListener('pointerleave', () => setActive(false))
      el.addEventListener('pointercancel', () => setActive(false))

      this.container.appendChild(el)
    })

    document.body.appendChild(this.container)
  }

  end() {
    if (this.container)
      this.container.remove()
  }
}