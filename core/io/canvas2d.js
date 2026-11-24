export const canvas2d = document.getElementById('platno')
export const ctx = canvas2d.getContext('2d')

canvas2d.style.display = 'none'

const resize = () => {
  canvas2d.width = window.innerWidth
  canvas2d.height = window.innerHeight
}

resize()
window.addEventListener('resize', resize)
screen.orientation.addEventListener('change', resize)

/** The 2D sky fades from blue overhead to light blue at the ground. */
export const skyColors = { deep: 'blue', clear: '#3299CC', horizon: 'lightblue' }

export function drawSky(groundLevel, skyColor = skyColors.deep, horizonColor = skyColors.horizon, gradientStart = 0) {
  const ctx = canvas2d.getContext('2d')
  ctx.fillStyle = skyColor
  if (horizonColor) {
    const preliv = ctx.createLinearGradient(0, gradientStart, 0, groundLevel)
    preliv.addColorStop(0, skyColor)
    preliv.addColorStop(1, horizonColor)
    ctx.fillStyle = preliv
  }
  ctx.fillRect(0, 0, canvas2d.width, groundLevel)
}

export default canvas2d
