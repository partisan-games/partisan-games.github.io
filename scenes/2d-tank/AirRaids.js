import Aircraft from './Aircraft.js'
import { enemyAircraftArt } from './enemyArt.js'

/** One aircraft pass at a time, with a quiet interval on the gameplay clock. */
export default class AirRaids {
  constructor({ clock, ...options }) {
    this.clock = clock
    this.planes = ['fighter', 'diveBomber'].map(kind => new Aircraft({ ...options, clock, kind, art: enemyAircraftArt[kind] }))
    this.next = 0
    this.nextAt = clock.now + 28
  }

  update() {
    if (this.clock.now < this.nextAt || this.planes.some(plane => plane.active)) return
    const plane = this.planes[this.next]
    plane.launch()
    this.next = (this.next + 1) % this.planes.length
    this.nextAt = this.clock.now + 36
  }
}
