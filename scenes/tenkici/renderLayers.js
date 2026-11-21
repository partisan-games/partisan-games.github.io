/** The clip frame of `actor` at `time`: a loop, or rare gestures between long rests. */
function frameFor(actor, time) {
  if (!actor.gestures) return Math.floor(time % actor.duration / actor.duration * actor.frameCount)
  const { window, delay, jitter, duration, seed } = actor.gestures
  const slot = Math.floor(time / window)
  const random = value => {
    const n = Math.sin(value * 12.9898 + seed) * 43758.5453
    return n - Math.floor(n)
  }
  const start = slot * window + delay + random(slot) * jitter
  if (time < start || time >= start + duration) return 0
  return 1 + Math.floor(random(slot + .37) * (actor.frameCount - 1))
}

/**
 * Composes an animated background from its layers (sky, drifting clouds, the still base and clips of its living
 * things), in the picture's own pixels; the time is the scene's, from its caller.
 */
export default function renderLayers(ctx, images, layout, elapsed, { actors = true, clouds = true } = {}) {
  const time = Math.max(0, elapsed)
  const { width, height } = layout
  ctx.save()
  ctx.imageSmoothingEnabled = false
  const sky = ctx.createLinearGradient(0, 0, 0, 500)
  sky.addColorStop(0, '#6298e8')
  sky.addColorStop(1, '#a8c9f2')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)
  if (clouds) {
    const offset = time * layout.cloudSpeed % width
    ctx.drawImage(images.clouds, -offset, 0, width, height)
    ctx.drawImage(images.clouds, width - offset, 0, width, height)
  }
  ctx.drawImage(images.base, 0, 0, width, height)
  if (actors) for (const actor of layout.actors) {
    const frame = frameFor(actor, time)
    const { cell } = layout
    ctx.drawImage(images.actors, frame * cell, actor.row * cell, cell, cell,
      actor.x - actor.anchor[0], actor.y - actor.anchor[1], cell, cell)
    // Restore the unchanged foreground sandbags over the observer's waist.
    for (const [x, y, w, h] of actor.occlusion || [])
      ctx.drawImage(images.base, x, y, w, h, x, y, w, h)
  }
  ctx.restore()
}
