import { currentStyleClasses, onStyleChange } from './styles.js'

/** A bar at the top right, styled like the health bar, that fills while a shot is charged. */
export default class PowerMeter {
  constructor({ min, max, chargePerSecond }) {
    this.min = min
    this.max = max
    this.chargePerSecond = chargePerSecond
    this.element = document.createElement('progress')
    this.restyle()
    this.stopRestyling = onStyleChange(this.restyle)
    document.body.prepend(this.element)
    this.reset()
  }

  restyle = () => {
    this.element.className = `progress top-right ${currentStyleClasses().healthBar}`
  }

  charge(dt) {
    this.value = Math.min(this.max, this.value + this.chargePerSecond * dt)
    this.render()
  }

  reset() {
    this.value = this.min
    this.render()
  }

  render() {
    this.element.value = (this.value - this.min) / (this.max - this.min)
  }

  end() {
    this.stopRestyling()
    this.element.remove()
  }
}
