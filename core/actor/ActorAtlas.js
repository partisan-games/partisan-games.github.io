import ArtClip from './ArtClip.js'

/** An actor's prepared poses and attachments; collision dimensions belong to its body. */
export default class ActorAtlas extends ArtClip {
  constructor(art) {
    super(art)
    this.layers = (art.layers ?? []).map(layer => {
      if (layer.name === 'turret') return { ...layer, image: this.image }
      const [width, height] = layer.frame
      const view = new ArtClip({ src: layer.image.replace('assets/images/', ''), width, height,
        anchor: { x: layer.anchor[0], y: layer.anchor[1] },
        clips: { spin: { ms: Array(layer.frames).fill(layer.seconds * 1000 / layer.frames), loop: true } } })
      this.children.push(view)
      return { ...layer, view }
    })
  }

  drawLocal(ctx, owner, name, time, { elapsed = time, gunTime = 0, gunAngle = 0 } = {}) {
    if (!this.image.naturalWidth) return false
    const { art } = this
    const [left, top, right, bottom] = art.bounds
    const sx = owner.width / (right - left), sy = owner.height / (bottom - top)
    const cx = (left + right) / 2, cy = (top + bottom) / 2
    const { row, frame } = this.sample(name, time)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, frame * art.width, row * art.height, art.width, art.height,
      -cx * sx, -cy * sy, art.width * sx, art.height * sy)
    for (const layer of this.layers) {
      if (layer.hideOn?.includes(name)) continue
      const turret = layer.name === 'turret'
      const image = turret ? this.image : layer.view.image
      if (!image.naturalWidth) continue
      const width = turret ? art.width : layer.frame[0], height = turret ? art.height : layer.frame[1]
      const index = turret ? this.sample('gun', gunTime).frame : layer.view.sample('spin', elapsed).frame
      ctx.save()
      ctx.translate((layer.mount[0] - cx) * sx, (layer.mount[1] - cy) * sy)
      if (turret) ctx.rotate(gunAngle)
      ctx.drawImage(image, index * width, (layer.row ?? 0) * height, width, height,
        -layer.anchor[0] * sx, -layer.anchor[1] * sy, width * sx, height * sy)
      ctx.restore()
    }
    return true
  }
}
