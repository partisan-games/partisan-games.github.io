import canvas2d from '/core/io/canvas2d.js'
import Marksman from '/core/gameplay/controllers/Marksman.js'
import ShoreMachineGun from './ShoreMachineGun.js'

/** A bounded set of positions: terrain determines the site, never the camera's movement. */
export default class ShoreDefenses {
  constructor({ coast, ...options }) {
    this.coast = coast
    this.viewLeft = options.viewLeft
    this.session = options.session
    this.spacing = Math.max(1800, canvas2d.width * 1.9)
    this.positions = [-1, 1].map(side => {
      const post = new ShoreMachineGun(options)
      post.controller = new Marksman(post, options.target)
      post.side = side
      return post
    })
    let nextX = canvas2d.width * 1.5
    for (const post of this.positions) {
      this.place(post, nextX)
      nextX = post.x + this.spacing
    }
  }

  place(post, fromX) {
    const { side } = post
    // Sample the entire footprint, including terrain vertices underneath it.
    for (let i = 0; i < 64; i++) {
      const x = fromX + i * this.coast.noiseResolution
      const left = x - post.width / 2, right = x + post.width / 2
      const edges = [this.coast.edgeAt(left, side), this.coast.edgeAt(right, side)]
      for (let sample = Math.ceil(left / this.coast.noiseResolution) * this.coast.noiseResolution;
        sample < right; sample += this.coast.noiseResolution) edges.push(this.coast.edgeAt(sample, side))
      const boundary = side < 0 ? Math.min(...edges) : Math.max(...edges)
      const y = boundary + side * (post.height / 2 + 2)
      if (y - post.height / 2 < 1 || y + post.height / 2 > canvas2d.height - 1) continue
      post.deploy(x, y, side)
      return true
    }
    return false
  }

  update() {
    if (this.session.state !== 'running') return
    for (const post of this.positions) {
      if (post.visible && post.x + post.width / 2 >= this.viewLeft() - canvas2d.width * .5) continue
      const lastX = Math.max(this.viewLeft() + canvas2d.width, ...this.positions.map(p => p.x))
      this.place(post, lastX + this.spacing)
    }
  }
}
