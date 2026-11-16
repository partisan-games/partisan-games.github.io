import { ctx } from '/core/io/canvas2d.js'

/** Draw at game size with a fixed foot anchor, independently of atlas resolution. */
export default function artFrame(actor, { footOffset, baseline = .95, direction = 1 }) {
  if (!actor.animation) return
  const { width, height, startFrame, frameCount, loop } = actor.animation
  const time = loop ? actor.animationElapsed % actor.animationTime : actor.animationElapsed
  const frame = Math.min(frameCount - 1, Math.floor(time / actor.animationTime * frameCount))
  const row = startFrame / frameCount
  ctx.save()
  ctx.scale(direction, 1)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(actor.image, frame * width, row * height, width, height,
    -actor.width / 2, footOffset - actor.height * baseline, actor.width, actor.height)
  ctx.restore()
}
