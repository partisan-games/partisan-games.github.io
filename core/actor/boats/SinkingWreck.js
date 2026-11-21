/** Seconds the hull takes to sink out of sight, and seconds its smoke, bubbles and ring last. */
export const sinking = { hull: 4, effects: 5 }

/**
 * The smoke, bubbles and ring of a hull `age` seconds into its sinking, drawn about the boat `view` on the screen, which
 * has `x`, `y`, `angle`, `width` and `height`. Fixed emission times avoid making particles during the sinking.
 */
export function renderSinking(ctx, view, age) {
  if (age >= sinking.effects) return
  ctx.save()
  for (let i = 0; i < 12; i++) {
    const elapsed = age - i * .18
    if (elapsed < 0 || elapsed >= 1.6) continue
    const progress = elapsed / 1.6
    const along = Math.cos(i * 2.3) * view.width * .12
    const x = view.x + Math.cos(view.angle) * along + Math.sin(i * 1.7) * progress * 12
    const y = view.y + Math.sin(view.angle) * along - progress * 48
    ctx.fillStyle = `rgba(53, 58, 54, ${(1 - progress) * .4})`
    ctx.beginPath()
    ctx.arc(x, y, 4 + progress * 13, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 18; i++) {
    const elapsed = age - .55 - i * .22
    if (elapsed < 0 || elapsed >= .65) continue
    const progress = elapsed / .65
    const along = Math.sin(i * 2.1) * view.width * .32
    const x = view.x + Math.cos(view.angle) * along + Math.sin(i) * 5
    const y = view.y + Math.sin(view.angle) * along - progress * 8
    ctx.strokeStyle = `rgba(194, 222, 225, ${(1 - progress) * .7})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, 1 + progress * 3, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = `rgba(170, 201, 205, ${.4 * (1 - age / sinking.effects)})`
  ctx.lineWidth = 1
  ctx.translate(view.x, view.y)
  ctx.rotate(view.angle)
  ctx.beginPath()
  ctx.ellipse(0, 0, view.width * .4 + age * 4, view.height * .45 + age * 3, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
