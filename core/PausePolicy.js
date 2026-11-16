/** Pauses a running game when the player leaves it: a released mouse lock, or, in a game without one, a hidden page. */
export default class PausePolicy {
  constructor({ usePointerLock, pause }) {
    this.pause = pause
    this.event = usePointerLock ? 'pointerlockchange' : 'visibilitychange'
    this.hasLeft = usePointerLock
      ? () => !document.pointerLockElement
      : () => document.visibilityState === 'hidden'
    document.addEventListener(this.event, this.handleChange)
  }

  handleChange = () => {
    if (this.hasLeft()) this.pause()
  }

  end() {
    document.removeEventListener(this.event, this.handleChange)
  }
}
