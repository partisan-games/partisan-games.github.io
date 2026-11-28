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

  /** Warm the near soil and pick out sparse limestone and dry grass along its silhouette. */
  paintSurface(ctx) {
    const soil = ctx.createLinearGradient(0, this.top - 100, 0, this.height)
    soil.addColorStop(0, 'rgba(156, 118, 70, .10)')
    soil.addColorStop(.55, 'rgba(136, 93, 59, .27)')
    soil.addColorStop(1, 'rgba(58, 42, 33, .40)')
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = soil
    ctx.fillRect(0, 0, this.width, this.height)
    for (let x = 8; x < this.width - 5; x += 7) {
      const seed = Math.imul(x ^ (x >>> 3), 0x45d9f3b) >>> 0
      const y = (this.surface[x] ?? this.floorY) - grassAbove
      if (seed % 7 < 2) {
        ctx.fillStyle = '#87744f'
        ctx.fillRect(x, y + 1, 4, 2)
        ctx.fillStyle = '#b7a180'
        ctx.fillRect(x + 1, y, 3, 2)
      } else if (seed % 7 === 2) {
        ctx.fillStyle = '#ad955c'
        ctx.fillRect(x, y + 1, 2, 3)
      }
    }
    ctx.globalCompositeOperation = 'source-over'
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
    this.paintSurface(ctx)
    const rim = this.pattern(ctx, this.rim)
    for (const { left, floors } of this.cuts)
      floors.forEach((floor, i) => {
        const x = left + i * crater.column, seen = floor - grassAbove
        // Scorch only earth that is still there, then remove everything above the crater's floor.
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = rim
        ctx.fillRect(x, seen, crater.column, rimThickness)
        ctx.fillStyle = 'rgba(151, 104, 69, .6)'
        ctx.fillRect(x, seen, crater.column, 2)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillRect(x, 0, crater.column, seen)
      })
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = this.pattern(ctx, this.wall)
    ctx.fillRect(0, this.top, this.width, this.height - this.top)
    ctx.globalCompositeOperation = 'source-over'
    this.dirty = false
  }

  /** A single copy of the cached soil and the exposed crater walls. */
  render(ctx) {
    if (![this.earth, this.wall, this.rim].every(img => img.complete && img.naturalWidth)) return
    if (this.dirty) this.redraw()
    ctx.drawImage(this.canvas, 0, 0)
  }

  /** Frees the hidden canvas when the scene ends. */
  dispose() {
    if (this.canvas) this.canvas.width = this.canvas.height = 0
    this.canvas = null
    this.dirty = true
  }
}
