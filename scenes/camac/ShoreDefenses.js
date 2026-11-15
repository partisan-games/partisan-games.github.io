import platno from '/core/io/platno.js'
import ShoreMachineGun from './ShoreMachineGun.js'

/** A bounded set of positions: terrain determines the site, never the camera's movement. */
export default class ShoreDefenses {
  constructor({ coast, ...options }) {
    this.coast = coast
    this.viewLeft = options.viewLeft
    this.session = options.session
    this.spacing = Math.max(1400, platno.width * 1.6)
    this.positions = [-1, 1].map(side => {
      const post = new ShoreMachineGun(options)
      post.side = side
      return post
    })
    let nextX = platno.width * 1.5
    for (const post of this.positions) {
      this.place(post, nextX)
      nextX = post.x + this.spacing
    }
  }

  place(post, fromX) {
    const side = post.side
    // Sample the entire footprint, including terrain vertices underneath it.
    for (let i = 0; i < 64; i++) {
      const x = fromX + i * this.coast.noiseResolution
      const left = x - post.sirina / 2, right = x + post.sirina / 2
      const edges = [this.coast.edgeAt(left, side), this.coast.edgeAt(right, side)]
      for (let sample = Math.ceil(left / this.coast.noiseResolution) * this.coast.noiseResolution;
        sample < right; sample += this.coast.noiseResolution) edges.push(this.coast.edgeAt(sample, side))
      const boundary = side < 0 ? Math.min(...edges) : Math.max(...edges)
      const y = boundary + side * (post.visina / 2 + 2)
      if (y - post.visina / 2 < 1 || y + post.visina / 2 > platno.height - 1) continue
      post.deploy(x, y, side)
      return true
    }
    return false
  }

  update() {
    if (this.session.state !== 'running') return
    for (const post of this.positions) {
      if (post.vidljiv && post.x + post.sirina / 2 >= this.viewLeft() - platno.width * .5) continue
      const lastX = Math.max(this.viewLeft() + platno.width, ...this.positions.map(p => p.x))
      this.place(post, lastX + this.spacing)
    }
  }
}
