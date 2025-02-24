// prevent shake, click on enter, scroll, etc.
const preventSome = e => {
  if (['Space', 'Enter', 'PageUp', 'PageDown'].includes(e.code) || e.code.startsWith('Arrow'))
    e.preventDefault()
}

class Keyboard {
  #capsLock = false

  constructor({ listen = true, attackKey = 'Enter' } = {}) {
    this.pressed = {}
    this.attackKey = attackKey

    if (!listen) return

    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.reset = this.reset.bind(this)

    document.addEventListener('contextmenu', e => e.preventDefault())

    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)

    document.addEventListener('pointerdown', this.handlePointerDown)
    document.addEventListener('pointerup', this.handlePointerUp)

    document.addEventListener('visibilitychange', this.reset)
    window.addEventListener('blur', this.reset)
  }

  /* EVENT LISTENERS */

  handlePointerDown(e) {
    if (e.button === 0) this.pressed.pointer = true
  }

  handlePointerUp(e) {
    if (e.button === 0) this.pressed.pointer = false
  }

  handleKeyDown(e) {
    preventSome(e)
    this.pressed[e.code] = true
  }

  handleKeyUp(e) {
    this.pressed[e.code] = false
    this.run = e.getModifierState('CapsLock')
  }

  reset() {
    for (const key in this.pressed) delete this.pressed[key]
  }

  /* GETTERS & SETTERS */

  get up() {
    return this.pressed.ArrowUp || this.pressed.KeyW
  }

  set up(bool) {
    this.pressed.ArrowUp = bool
  }

  get down() {
    return this.pressed.ArrowDown || this.pressed.KeyS
  }

  get left() {
    return this.pressed.ArrowLeft || this.pressed.KeyA
  }

  get right() {
    return this.pressed.ArrowRight || this.pressed.KeyD
  }

  get strafeLeft() {
    return this.pressed.PageUp || this.pressed.KeyQ
  }

  get strafeRight() {
    return this.pressed.PageDown || this.pressed.KeyE
  }

  get run() {
    return this.#capsLock || this.pressed.ShiftLeft
  }

  set run(bool) {
    this.#capsLock = bool
  }

  get space() {
    return this.pressed.Space
  }

  get attack() {
    return this.pressed[this.attackKey]
  }

  get attack2() {
    return this.pressed.KeyC
  }

  get special() {
    return this.pressed.KeyV
  }

  /* UTILS */

  get arrowPressed() {
    return this.pressed.ArrowRight || this.pressed.ArrowLeft || this.pressed.ArrowDown || this.pressed.ArrowUp
  }

  get controlsPressed() {
    return this.arrowPressed || this.pressed.KeyW || this.pressed.KeyA || this.pressed.KeyS || this.pressed.KeyD
  }

  get totalPressed() {
    return Object.values(this.pressed).filter(x => x).length
  }

  get keyPressed() {
    return this.totalPressed > 0
  }

  get touched() {
    return Object.keys(this.pressed).length > 0
  }

  end() {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)

    document.removeEventListener('pointerdown', this.handlePointerDown)
    document.removeEventListener('pointerup', this.handlePointerUp)

    document.removeEventListener('visibilitychange', this.reset)
    window.removeEventListener('blur', this.reset)
  }
}

export default Keyboard

export const keyboard = new Keyboard() // export instance