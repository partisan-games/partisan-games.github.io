import { assets } from '/config.js'
import imageReady from '/core/io/imageReady.js'
import { crater } from './Terrain.js'

/** The layer's grass rises this far above the line units stand on, level with the turf strip under each cannon. */
const grassAbove = 7
/** Thickness of the scorched rim below a crater's floor. */
const rimThickness = 5

const image = src => {
  const result = new Image()
  result.src = `${assets.images}background/${src}`
  return result
}

/**
 * The front layer of earth that shells cut into, rising over a hill where the `surface` (a height a pixel column, y
 * down) is above `floorY`, with its grass on top. It is redrawn into its own canvas only when a crater appears or a
 * round starts; through each hole in the level ground the dark crater wall is seen, not the street or the sky.
 */
export default class GroundLayer {
  constructor({ width, height, floorY, surface = [] }) {
    this.top = floorY - grassAbove
    this.floorY = floorY
    this.surface = surface
    this.width = width
    this.height = height
    this.earth = image('ustanak-tlo.png')
    this.wall = image('ustanak-tlo-zid.png')
    this.rim = image('ustanak-tlo-ivica.png')
    this.cuts = []
    this.dirty = true
    this.canvas = null
    this.wallPattern = null
  }

  loaded() {
    return Promise.all([this.earth, this.wall, this.rim].map(img => imageReady(img)))
  }

  /** A crater cut by Terrain: the floor of each 2 px column from `left`, on the line units stand on. */
  cut(cut) {
    this.cuts.push(cut)
    this.dirty = true
  }

  reset() {
    this.cuts = []
    this.dirty = true
  }

  /** A repeating tile whose top-left corner sits on the layer's top edge. */
  pattern(ctx, tile) {
    const pattern = ctx.createPattern(tile, 'repeat')
    pattern.setTransform(new DOMMatrix().translate(0, this.top))
    return pattern
  }

  redraw() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.canvas.width = this.width
      this.canvas.height = this.height
    }
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = this.pattern(ctx, this.earth)
    ctx.fillRect(0, this.top, this.width, this.height - this.top)
    // a hill: the earth, grass first, stands each crater column up from the hill's surface
    for (let x = 0; x < this.surface.length; x += crater.column) {
      const surface = this.surface[x]
      if (surface >= this.floorY) continue
      ctx.drawImage(this.earth, x % this.earth.naturalWidth, 0, crater.column, this.earth.naturalHeight,
        x, surface - grassAbove, crater.column, this.earth.naturalHeight)
    }
    const rim = this.pattern(ctx, this.rim)
    for (const { left, floors } of this.cuts)
      floors.forEach((floor, i) => {
        const x = left + i * crater.column, seen = floor - grassAbove
        // Scorch only earth that is still there, then remove everything above the crater's floor.
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = rim
        ctx.fillRect(x, seen, crater.column, rimThickness)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillRect(x, 0, crater.column, seen)
      })
    ctx.globalCompositeOperation = 'source-over'
    this.dirty = false
  }

  /** The crater wall behind the layer, then the layer with its holes. */
  render(ctx) {
    if (![this.earth, this.wall, this.rim].every(img => img.complete && img.naturalWidth)) return
    if (this.dirty) this.redraw()
    this.wallPattern ??= this.pattern(ctx, this.wall)
    ctx.fillStyle = this.wallPattern
    ctx.fillRect(0, this.top, this.width, this.height - this.top)
    ctx.drawImage(this.canvas, 0, 0)
  }

  /** Frees the hidden canvas when the scene ends. */
  dispose() {
    if (this.canvas) this.canvas.width = this.canvas.height = 0
    this.canvas = this.wallPattern = null
    this.dirty = true
  }
}
