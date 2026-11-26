/** Pauses a running game when the player leaves it: a hidden page, or a released mouse lock in a game that locks it. */
export default class PausePolicy {
  constructor({ usePointerLock, pause }) {
    this.pause = pause
    document.addEventListener('visibilitychange', this.handleVisibility)
    if (usePointerLock) document.addEventListener('pointerlockchange', this.handleLock)
  }

  handleVisibility = () => {
    if (document.visibilityState === 'hidden') this.pause()
  }

  handleLock = () => {
    if (!document.pointerLockElement) this.pause()
  }

  end() {
    document.removeEventListener('visibilitychange', this.handleVisibility)
    document.removeEventListener('pointerlockchange', this.handleLock)
  }
}
