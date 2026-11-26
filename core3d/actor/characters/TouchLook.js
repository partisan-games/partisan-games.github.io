import { gameplayInputAllowed } from '/core/io/inputContext.js'

/** Radians a character turns for each pixel a finger drags. */
const sensitivity = .005

/**
 * Turns a character and raises its aim as a finger drags across the game, the way MouseLook does with the locked mouse
 * on a screen without one. The drag is spent on the next update, so the body turns only as the game runs.
 */
export default class TouchLook {
  constructor(body) {
    this.body = body
    this.moved = { x: 0, y: 0 }
    this.finger = null
    // a drag across the game turns the view instead of scrolling or zooming the page
    this.touchAction = document.body.style.touchAction
    document.body.style.touchAction = 'none'
    document.addEventListener('pointerdown', this.down)
    document.addEventListener('pointermove', this.move)
    for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, this.up)
  }

  down = event => {
    if (event.pointerType !== 'touch' || this.finger || !gameplayInputAllowed(event.target)) return
    this.finger = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }

  move = event => {
    const { finger } = this
    if (event.pointerId !== finger?.id) return
    this.moved.x += event.clientX - finger.x
    this.moved.y += event.clientY - finger.y
    finger.x = event.clientX
    finger.y = event.clientY
  }

  up = event => {
    if (event.pointerId === this.finger?.id) this.finger = null
  }

  update() {
    const { moved } = this
    this.body.look(-moved.x * sensitivity, -moved.y * sensitivity)
    moved.x = moved.y = 0
  }

  end() {
    document.body.style.touchAction = this.touchAction
    document.removeEventListener('pointerdown', this.down)
    document.removeEventListener('pointermove', this.move)
    for (const type of ['pointerup', 'pointercancel']) document.removeEventListener(type, this.up)
  }
}
