import { width, height } from './Meadow.js'

/** The site's pixel wordmark and star, drawn in the same 480×270 frame as the film. */
export default function drawPromoLogo(frame, opacity) {
  if (opacity <= 0) return
  frame.save()
  frame.globalAlpha = opacity
  frame.fillStyle = '#d94a38'
  frame.beginPath()
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + point * Math.PI / 5
    const radius = point % 2 ? 9 : 22
    const x = width / 2 + Math.cos(angle) * radius
    const y = height / 2 - 62 + Math.sin(angle) * radius
    if (point) frame.lineTo(x, y)
    else frame.moveTo(x, y)
  }
  frame.closePath()
  frame.fill()
  frame.fillStyle = '#848c58'
  frame.font = '28px "Press Start 2P", monospace'
  frame.textAlign = 'center'
  frame.textBaseline = 'middle'
  frame.fillText('Partisan', width / 2, height / 2)
  frame.fillText('Games', width / 2, height / 2 + 42)
  frame.restore()
}
