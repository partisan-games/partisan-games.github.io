/** Radians a character turns for each pixel the mouse moves. */
const sensitivity = .002

/**
 * Turns a character and raises its aim as the locked mouse moves, the way a first-person player looks around. The
 * mouse moves between frames; its movement is spent on the next update, so the body turns only as the game runs.
 */
export default class MouseLook {
  constructor(body) {
    this.body = body
    this.moved = { x: 0, y: 0 }
    document.addEventListener('pointermove', this.move)
  }

  move = event => {
    if (!document.pointerLockElement) return
    this.moved.x += event.movementX
    this.moved.y += event.movementY
  }

  update() {
    const { moved } = this
    this.body.look(-moved.x * sensitivity, -moved.y * sensitivity)
    moved.x = moved.y = 0
  }

  end() {
    document.removeEventListener('pointermove', this.move)
  }
}
