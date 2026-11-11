import { keys, defaultAttackKey } from './keys.js'

// prevent shake, click on enter, scroll, etc.
const preventSome = e => {
  if (['Space', 'Enter', 'PageUp', 'PageDown'].includes(e.code) || e.code.startsWith('Arrow'))
    e.preventDefault()
}

class Keyboard {
  #capsLock = false

  constructor({ listen = true, attackKey = defaultAttackKey } = {}) {
    this.pressed = {}
    this.attackKey = attackKey

    if (!listen) return

    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.reset = this.reset.bind(this)

    document.addEventListener('contextmenu', this.preventContextMenu)

    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)

    document.addEventListener('pointerdown', this.handlePointerDown)
    document.addEventListener('pointerup', this.handlePointerUp)

    document.addEventListener('visibilitychange', this.reset)
    window.addEventListener('blur', this.reset)
  }

  /* EVENT LISTENERS */

  preventContextMenu = e => e.preventDefault()

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
    this.run = e.getModifierState(keys.run.lock)
  }

  reset() {
    for (const key in this.pressed) delete this.pressed[key]
  }

  /** Whether any key of a binding from core/io/keys.js is held. */
  isDown({ codes }) {
    return codes.some(code => this.pressed[code])
  }

  /* GETTERS & SETTERS */

  get up() {
    return this.isDown(keys.up)
  }

  // AI characters steer with a keyboard that does not listen
  set up(bool) {
    this.pressed[keys.up.codes[0]] = bool
  }

  get down() {
    return this.isDown(keys.down)
  }

  get left() {
    return this.isDown(keys.left)
  }

  get right() {
    return this.isDown(keys.right)
  }

  get strafeLeft() {
    return this.isDown(keys.strafeLeft)
  }

  get strafeRight() {
    return this.isDown(keys.strafeRight)
  }

  get run() {
    return this.#capsLock || this.isDown(keys.run)
  }

  set run(bool) {
    this.#capsLock = bool
  }

  get jump() {
    return this.isDown(keys.jump)
  }

  get attack() {
    return this.pressed[this.attackKey]
  }

  get attack2() {
    return this.isDown(keys.attack2)
  }

  get special() {
    return this.isDown(keys.special)
  }

  /* UTILS */

  get controlsPressed() {
    return this.up || this.down || this.left || this.right
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
    document.removeEventListener('contextmenu', this.preventContextMenu)
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