import GameObject2D from '/core/actor/GameObject2D.js'
import canvas2d from '/core/io/canvas2d.js'
import { settings } from './settings.js'

const { order, fallSpeed, images, scale } = settings.powerUps

/** A power-up that slowly falls down the screen until the player picks it up or it is past the bottom. */
export class PowerUp extends GameObject2D {
  constructor(kind, { x, y }) {
    super(images[kind], { scale, shadow: true })
    this.kind = kind
    this.setPosition(x, y)
    this.dy = fallSpeed
  }

  get gone() {
    return this.y > canvas2d.height + this.height
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
    const picked = this.player.alive ? this.items.filter(item => this.player.collidesWith(item)) : []
    picked.forEach(item => this.player.powerUp(item.kind))

    const done = this.items.filter(item => picked.includes(item) || item.gone)
    if (!done.length) return
    this.scene.remove(...done)
    this.items = this.items.filter(item => !done.includes(item))
  }
}
