import platno from '/core/io/platno.js'
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

  update() {
    if (this.session.state !== 'running') return
    const now = this.session.clock.now
    const boat = this.boat
    if (boat.active) {
      const outside = boat.x + boat.sirina / 2 < this.viewLeft() ||
        (boat.withdrawing && boat.x - boat.sirina / 2 > this.viewLeft() + platno.width)
      if ((boat.dead && now >= boat.wreckUntil) || (!boat.dead && (outside || now - boat.born >= 18))) {
        boat.active = false
        boat.nestani()
        this.nextAt = now + 28
      }
    } else if (now >= this.nextAt) {
      boat.launch(this.side)
      this.side *= -1
    }
  }
}
