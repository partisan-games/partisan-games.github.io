export default class Turns {
  constructor() {
    this.active = 0
    this.phase = 'aim'
    this.waitForRelease = true
  }

  fire(side) {
    if (side !== this.active || this.phase !== 'aim') return false
    this.phase = 'flight'
    return true
  }

  settle(hasActiveShot) {
    if (this.phase !== 'flight' || hasActiveShot) return false
    this.active = 1 - this.active
    this.phase = 'aim'
    this.waitForRelease = true
    return true
  }
}
