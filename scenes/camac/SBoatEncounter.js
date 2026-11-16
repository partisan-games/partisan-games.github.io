import canvas2d from '/core/io/canvas2d.js'
import SBoat from './SBoat.js'

/** A sparse encounter on the return leg; one reused enemy, with a quiet interval. */
export default class SBoatEncounter {
  constructor(options) {
    this.session = options.session
    this.viewLeft = options.viewLeft
    this.boat = new SBoat(options)
    this.nextAt = this.session.clock.now + 10
    this.side = 1
  }

  update({ allowSpawn = true } = {}) {
    if (this.session.state !== 'running') return
    const { now } = this.session.clock
    const { boat } = this
    if (boat.active) {
      const outside = boat.x + boat.width / 2 < this.viewLeft() ||
        (boat.withdrawing && boat.x - boat.width / 2 > this.viewLeft() + canvas2d.width)
      if ((boat.dead && boat.wreck.finished) || (!boat.dead && (outside || now - boat.born >= 18))) {
        boat.active = false
        boat.vanish()
        this.nextAt = now + 28
      }
    } else if (allowSpawn && now >= this.nextAt) {
      boat.launch(this.side)
      this.side *= -1
    }
  }
}
