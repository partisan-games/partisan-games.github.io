import { assets } from '/config.js'
import { coastlines, sampleSpacing, shoreBand, tileWidth } from './coastlines.js'

/**
 * The art of each stage's sea: the picture its open water comes from, and the coasts its islands and its town are cut
 * from, each the band of a picture along its `top` or `bottom` edge. The return to Vis, by night, passes the rocks and
 * the houses of the harbour of Vis. Šolta uses its bare limestone strip and its separate village strip.
 */
const seas = {
  'vis-luka': { water: 'vis-luka', rocks: { picture: 'vis-luka', band: 'bottom' }, houses: { picture: 'vis-luka', band: 'top' } },
  'solta': { water: 'solta', rocks: { picture: 'solta-coasts', band: 'top' }, houses: { picture: 'solta-coasts', band: 'bottom' } },
  'vis-kanal': { water: 'vis-kanal', rocks: { picture: 'vis-luka', band: 'bottom' }, houses: { picture: 'vis-luka', band: 'top' } },
}

/**
 * A stage's islands, in pixels: the open sea before the first, their lengths and the gaps after them in turn, the
 * side each lies on (-1 above, 1 below, 0 both) unless the stage has its own, how long their ends taper, and how far
 * before the stage's end the town on the upper coast begins, where a settlement is near.
 */
const islands = { open: 1200, lengths: [1000, 800, 1200, 900], gaps: [600, 900, 700, 1000], sides: [1, -1, 0, -1, 1, 0], taper: 250, town: 1800 }

/**
 * The stretches of coast of a stage from `start` to `start + length`: rocky islands on one side or both, taking their
 * `sides` in turn, then the town.
 */
export function coastStretches(start, length, sides = islands.sides) {
  const stretches = []
  const lastIsland = length - islands.town - islands.gaps[0]
  for (let i = 0, x = islands.open; x + islands.lengths[i % islands.lengths.length] <= lastIsland; i++) {
    const to = x + islands.lengths[i % islands.lengths.length]
    const side = sides[i % sides.length]
    for (const each of side ? [side] : [-1, 1]) stretches.push({ side: each, kind: 'rocks', from: start + x, to: start + to })
    x = to + islands.gaps[i % islands.gaps.length]
  }
  stretches.push({ side: -1, kind: 'houses', from: start + length - islands.town, to: Infinity })
  return stretches
}

const smooth = t => t * t * (3 - 2 * t)

/** The rows of a picture, as shares of its height, that are open water. */
const openWater = { from: .35, to: .65 }

/**
 * The sea of a stage `length` pixels long from `start`: open water, and the coasts of its stretches cut from the bands
 * of its pictures, mirrored in every other tile so neighbours meet at the same pixels, and tapering at an island's
 * ends. Only the land of a band is drawn, so a coast lies on any water.
 */
export default class Obala {
  constructor(canvas, stage, { start = 0, length = Infinity, sides } = {}) {
    this.canvas = canvas
    this.sea = seas[stage]
    this.stretches = coastStretches(start, length, sides)
    this.position = { z: 1 }
    this.sampleSpacing = sampleSpacing
    this.images = {}
    for (const picture of new Set([this.sea.water, this.sea.rocks.picture, this.sea.houses.picture])) {
      this.images[picture] = new Image()
      this.images[picture].src = assets.images + `background/camac-${picture}.png`
    }
  }

  get bandScale() {
    return Math.min(shoreBand, Math.floor(this.canvas.height / 2)) / shoreBand
  }

  /**
   * The coast on `side` at `x`: its `kind` ('rocks' or 'houses'), its art and how far out it reaches there (`reach`, from 0
   * at an island's tip to 1), or null.
   */
  landAt(x, side) {
    const stretch = this.stretches.find(each => each.side === side && x >= each.from && x < each.to)
    if (!stretch) return null
    const reach = Math.min(1, (x - stretch.from) / islands.taper, (stretch.to - x) / islands.taper)
    return { kind: stretch.kind, art: this.sea[stretch.kind], reach: smooth(Math.max(0, reach)) }
  }

  /** Where `x` falls in its tile's picture, read backwards in a mirrored tile. */
  source(x) {
    const tile = Math.floor(x / tileWidth)
    const offset = x - tile * tileWidth
    return { mirror: tile % 2 !== 0, x: tile % 2 ? tileWidth - offset : offset }
  }

  /** How deep the land of a band reaches into its picture at `x`, in the band's pixels. */
  depth({ picture, band }, x) {
    const edge = coastlines[picture][band]
    const sample = Math.min(edge.length - 1.001, this.source(x).x / sampleSpacing)
    const index = Math.floor(sample)
    return edge[index] + (edge[index + 1] - edge[index]) * (sample - index)
  }

  /** The screen y where the water meets the coast on `side` (-1 above, 1 below) at `x`; the screen's edge with none. */
  edgeAt(x, side) {
    const land = this.landAt(x, side)
    const depth = land ? this.depth(land.art, x) * land.reach * this.bandScale : 0
    return side < 0 ? depth : this.canvas.height - depth
  }

  /** Extremes of the piecewise linear coast under the full width of a hull or a shore position. */
  edgeRange(left, right, side) {
    const ends = [this.edgeAt(left, side), this.edgeAt(right, side)]
    let min = Math.min(...ends), max = Math.max(...ends)
    for (let x = Math.ceil(left / sampleSpacing) * sampleSpacing; x < right; x += sampleSpacing) {
      const y = this.edgeAt(x, side)
      min = Math.min(min, y)
      max = Math.max(max, y)
    }
    return { min, max }
  }

  render(ctx, { x, width, height }) {
    const water = this.images[this.sea.water]
    if (!Object.values(this.images).every(image => image.naturalWidth)) return
    ctx.save()
    ctx.imageSmoothingEnabled = false
    for (let tile = Math.floor(x / tileWidth); tile < Math.ceil((x + width) / tileWidth); tile++) {
      const mirror = tile % 2 !== 0
      ctx.save()
      ctx.translate((tile + (mirror ? 1 : 0)) * tileWidth, 0)
      if (mirror) ctx.scale(-1, 1)
      // the middle of the picture, away from the lights and shallows its own coasts cast on the water
      const top = water.naturalHeight * openWater.from, rows = water.naturalHeight * (openWater.to - openWater.from)
      ctx.drawImage(water, 0, top, tileWidth, rows, 0, 0, tileWidth, height)
      ctx.restore()
    }
    for (const side of [-1, 1])
      for (let left = Math.floor(x / sampleSpacing) * sampleSpacing; left < x + width; left += sampleSpacing) {
        const land = this.landAt(left + sampleSpacing / 2, side)
        if (land) this.drawLand(ctx, land, left, side, height)
      }
    ctx.restore()
  }

  /**
   * One column of land, `sampleSpacing` wide from `left`, cut from its band down to the coast and squeezed by its
   * reach, from the screen's edge on `side` into the sea.
   */
  drawLand(ctx, { art, reach }, left, side, height) {
    const image = this.images[art.picture]
    const { mirror, x } = this.source(left)
    const rows = Math.min(shoreBand, Math.ceil(this.depth(art, left + sampleSpacing / 2)) + 2)
    const drawn = rows * reach * this.bandScale
    if (drawn < 1) return
    const fromTop = art.band === 'top'
    const inward = side < 0 ? 1 : -1
    ctx.save()
    ctx.translate(left + (mirror ? sampleSpacing : 0), side < 0 ? 0 : height)
    ctx.scale(mirror ? -1 : 1, (fromTop ? inward : -inward) * drawn / rows)
    const sourceX = mirror ? x - sampleSpacing : x
    ctx.drawImage(image, Math.max(0, sourceX), fromTop ? 0 : image.naturalHeight - rows, sampleSpacing, rows,
      0, fromTop ? 0 : -rows, sampleSpacing, rows)
    ctx.restore()
  }
}
