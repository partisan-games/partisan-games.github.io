/** Surviving defenders offer surrender once a majority can no longer fight. */
export default class Garrison {
  surrendered = false

  constructor(strength) {
    this.strength = strength
  }

  update(living) {
    if (this.surrendered || living * 2 >= this.strength) return false
    this.surrendered = true
    return true
  }
}
