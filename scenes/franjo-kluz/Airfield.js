import { assets } from '/config.js'
import { ctx } from '/core/io/canvas2d.js'
import WorldSprite from '/core/actor/WorldSprite.js'

/** Length of the asphalt runway after the airfield building, and how much of it shows above the ground, in pixels. */
export const runway = { length: 2000 }
const runwayThickness = 14

/** The partisan airfield: its building, and the asphalt runway behind it where the plane must land. */
export default class Airfield extends WorldSprite {
  constructor(options) {
    super('game-ready/scenery/franjo-kluz/aerodrom.webp', options)
    this.children.push(this.createRunway())
  }

  /** The runway is dark asphalt, as on the 3D airport, right after the building, so the pilot sees where to land. */
  createRunway() {
    const image = new Image()
    const strip = {
      position: this.position,
      image,
      imageLoaded: new Promise(resolve => {
        image.onload = resolve
      }),
      render: () => {
        if (!image.naturalWidth) return
        const { left } = this.runway
        ctx.fillStyle = strip.pattern ??= ctx.createPattern(image, 'repeat')
        ctx.fillRect(left, this.surface, runway.length, runwayThickness)
      },
    }
    image.src = `${assets.images}textures/terrain/asphalt.jpg`
    return strip
  }

  get runway() {
    const left = this.x + this.width / 2
    return { left, right: left + runway.length }
  }

  /** The height of the runway's top, where the wheels roll. */
  get surface() {
    return this.groundY - runwayThickness
  }

  /** The height of what stands under `x`: the runway's top on it, the ground line elsewhere. */
  groundAt(x) {
    return this.holds(x) ? this.surface : this.groundY
  }

  /** Whether a plane whose wheels are at `x` stands on the runway. */
  holds(x) {
    const { left, right } = this.runway
    return x >= left && x <= right
  }
}
