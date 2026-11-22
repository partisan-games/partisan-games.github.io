/** The crew offers surrender once, when its last machine gun is knocked out. */
export default class Garrison {
  surrendered = false

  update(gunsLeft) {
    if (this.surrendered || gunsLeft !== 0) return false
    this.surrendered = true
    return true
  }
}
