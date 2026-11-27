import ArtClip from '/core/actor/ArtClip.js'

const art = {
  src: 'game-ready/scenery/otpisani/supply-crate.webp',
  width: 72,
  height: 56,
  gutter: 4,
  anchor: { x: 36, y: 52 },
  clips: {
    closed: { row: 0, frameColumns: [0], ms: [1000] },
    open: { row: 0, frameColumns: [1], ms: [1000] },
  },
}

export default class SupplyCrate {
  constructor({ x, feet, scale = () => 1 }) {
    this.place = { x, feet }
    this.scale = scale
    this.sheet = new ArtClip(art)
    this.children = [this.sheet]
    this.states = Object.keys(art.clips)
    this.state = 'closed'
    this.layer = 1
  }

  get x() {
    return this.place.x * this.scale()
  }

  get feet() {
    return this.place.feet * this.scale()
  }

  setState(state) {
    this.state = state
  }

  openAt(x, y) {
    const scale = this.scale()
    if (this.state !== 'closed' || Math.abs(x - this.x) > 28 * scale ||
      y > this.feet || y < this.feet - 36 * scale) return false
    this.setState('open')
    return true
  }

  render(ctx) {
    this.sheet.draw(ctx, { name: this.state, time: 0, x: this.x, y: this.feet, scaleX: this.scale() })
  }
}
