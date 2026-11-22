import Flame from '../Flame.js'
import Sound from '/core/io/audio/SoundSource.js'

/** Existing live fire/smoke particles, owned by the damaged view rather than painted into its hull. */
export default class DamageSmoke {
  constructor(view) {
    this.view = view
    this.position = { z: view.position.z - .1 }
    this.smoke = new Flame(0, 0, { reuseParticles: true })
    this.fire = new Flame(0, 0, { reuseParticles: true })
    this.sound = new Sound('fire.mp3', { loop: true, volume: .08, profile: 'fire',
      spatial: { getPosition: () => view.position } })
    this.sounds = [this.sound]
    this.last = null
  }

  get active() {
    const { body } = this.view
    return body.alive && body.health.current < body.health.maximum / 2
  }

  update(dt) {
    const { view } = this
    this.position.z = view.position.z - .1
    const burning = this.active && view.body.health.current < view.body.health.maximum / 4
    this.sound.setPlaying(burning)
    if (!this.active || !view.shown) {
      this.smoke.clear()
      this.fire.clear()
      this.last = null
      return
    }
    const point = { x: view.x, y: view.y }
    for (const effect of [this.smoke, this.fire]) {
      if (this.last) for (const particle of effect.sparks) {
        particle.x += point.x - this.last.x
        particle.y += point.y - this.last.y
      }
      effect.x = point.x
      effect.y = point.y
    }
    this.smoke.update(dt * .3)
    if (burning) this.fire.update(dt * .15)
    else this.fire.clear()
    this.last = point
  }

  render() {
    if (!this.active || !this.view.shown) return
    this.fire.render()
    this.smoke.render(true)
  }
}
