export default class Wind {
  constructor({ random = Math.random } = {}) {
    this.random = random
    this.enabled = true
    this.nextRound()
  }

  nextRound() {
    this.strength = (8 + this.random() * 8) * (this.random() < .5 ? -1 : 1)
  }

  get acceleration() {
    return this.enabled ? this.strength : 0
  }

  get drift() {
    return this.acceleration * 1.5
  }
}
