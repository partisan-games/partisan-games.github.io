import Predmet from '/core/actor/Predmet.js'
import platno from '/core/io/platno.js'
import { settings } from './settings.js'

const { order, fallSpeed, images, scale } = settings.powerUps

/** A power-up that slowly falls down the screen until the player picks it up or it is past the bottom. */
export class PowerUp extends Predmet {
  constructor(kind, { x, y }) {
    super(images[kind], { skalar: scale, senka: true })
    this.kind = kind
    this.postavi(x, y)
    this.dy = fallSpeed
  }

  get gone() {
    return this.y > platno.height + this.visina
  }
}

/** Drops the power-ups in their order, gives the player the ones it touches and takes out the ones that are gone. */
export default class PowerUps {
  constructor({ scene, player }) {
    this.scene = scene
    this.player = player
    this.items = []
    this.dropped = 0
  }

  drop(position) {
    const item = new PowerUp(order[this.dropped++ % order.length], position)
    this.items.push(item)
    this.scene.add(item)
  }

  update() {
    const picked = this.player.alive ? this.items.filter(item => this.player.sudara(item)) : []
    picked.forEach(item => this.player.powerUp(item.kind))

    const done = this.items.filter(item => picked.includes(item) || item.gone)
    if (!done.length) return
    this.scene.remove(...done)
    this.items = this.items.filter(item => !done.includes(item))
  }
}
