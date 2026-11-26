import { keys, defaultAttackKey } from './keys.js'
import { gameplayInputAllowed, isUiTarget } from './inputContext.js'

// prevent shake, click on enter, scroll, etc.
const preventSome = e => {
  if (['Space', 'Enter', 'PageUp', 'PageDown'].includes(e.code) || e.code.startsWith('Arrow'))
    e.preventDefault()
}

class Keyboard {
  #capsLock = false

  /** `touchPressesPointer`: whether a finger on the game holds the pointer as the mouse button does. */
  constructor({ listen = true, attackKey = defaultAttackKey, touchPressesPointer = true } = {}) {
    this.pressed = {}
    this.attackKey = attackKey
    this.touchPressesPointer = touchPressesPointer
    this.listen = listen

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
    document.addEventListener('pointercancel', this.handlePointerCancel)

    document.addEventListener('visibilitychange', this.reset)
    window.addEventListener('blur', this.reset)
    document.addEventListener('game-input-reset', this.reset)
    document.addEventListener('focusin', this.handleFocus)
  }

  preventContextMenu = e => {
    if (gameplayInputAllowed(e.target)) e.preventDefault()
  }

  handleFocus = e => {
    if (isUiTarget(e.target)) this.reset()
  }

  handlePointerDown(e) {
    if (!gameplayInputAllowed(e.target) || (!this.touchPressesPointer && e.pointerType === 'touch')) return
    if (e.button === 0) this.pressed.pointer = true
  }

  handlePointerUp(e) {
    if (e.button === 0) this.pressed.pointer = false
  }

  handlePointerCancel = () => {
    this.pressed.pointer = false
  }

  handleKeyDown(e) {
    this.run = e.getModifierState?.(keys.run.lock) ?? false
    if (!gameplayInputAllowed(e.target)) return
    preventSome(e)
    this.pressed[e.code] = true
  }

  handleKeyUp(e) {
    this.pressed[e.code] = false
    this.run = e.getModifierState?.(keys.run.lock) ?? false
  }

  reset() {
    for (const key in this.pressed) delete this.pressed[key]
    this.#capsLock = false
  }

  /** Whether any key of a binding from core/io/keys.js is held. */
  isDown({ codes }) {
    if (this.listen && !gameplayInputAllowed()) return false
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
    if (this.listen && !gameplayInputAllowed()) return false
    return this.#capsLock || this.isDown(keys.run)
  }

  set run(bool) {
    this.#capsLock = bool
  }

  get jump() {
    return this.isDown(keys.jump)
  }

  get attack() {
    if (this.listen && !gameplayInputAllowed()) return false
    return this.pressed[this.attackKey]
  }

  get attack2() {
    return this.isDown(keys.attack2)
  }

  get special() {
    return this.isDown(keys.special)
  }

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
    this.reset()
    document.removeEventListener('contextmenu', this.preventContextMenu)
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)

    document.removeEventListener('pointerdown', this.handlePointerDown)
    document.removeEventListener('pointerup', this.handlePointerUp)
    document.removeEventListener('pointercancel', this.handlePointerCancel)

    document.removeEventListener('visibilitychange', this.reset)
    window.removeEventListener('blur', this.reset)
    document.removeEventListener('game-input-reset', this.reset)
    document.removeEventListener('focusin', this.handleFocus)
  }
}

export default Keyboard

export const keyboard = new Keyboard() // export instance
