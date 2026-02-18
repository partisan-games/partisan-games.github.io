export const platno = document.getElementById('platno')
export const ctx = platno.getContext('2d')

platno.style.display = 'none'

const resize = () => {
  platno.width = window.innerWidth
  platno.height = window.innerHeight

  // platno.style.width = window.innerWidth + 'px'
  // platno.style.height = window.innerHeight + 'px'

  // ctx.setTransform(1, 0, 0, 1, 0, 0)
}

resize()
window.addEventListener('resize', resize)
screen.orientation.addEventListener('change', resize)

export function crtaNebo(nivoTla, bojaNeba = 'blue', bojaNebaPreliv = 'lightblue', pocetakPreliva = 0) {
  const ctx = platno.getContext('2d')
  ctx.fillStyle = bojaNeba
  if (bojaNebaPreliv) {
    const preliv = ctx.createLinearGradient(0, pocetakPreliva, 0, nivoTla)
    preliv.addColorStop(0, bojaNeba)
    preliv.addColorStop(1, bojaNebaPreliv)
    ctx.fillStyle = preliv
  }
  ctx.fillRect(0, 0, platno.width, nivoTla)
}

function crtaZemlju(nivoTla, bojaZemlje = '#00b011') {
  const ctx = platno.getContext('2d')
  ctx.fillStyle = bojaZemlje
  ctx.fillRect(0, nivoTla, platno.width, platno.height)
}

function crtaLiniju(nivoTla) {
  const ctx = platno.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(0, nivoTla)
  ctx.lineTo(platno.width, nivoTla)
  ctx.stroke()
}

export function crtaNeboZemlju(nivoTla,
  { bojaNeba = '#3299CC', bojaZemlje = '#32cd32', bojaNebaPreliv = 'lightblue', linija = false } = {}
) {
  crtaNebo(nivoTla, bojaNeba, bojaNebaPreliv)
  if (linija) crtaLiniju(nivoTla)
  crtaZemlju(nivoTla, bojaZemlje)
}

export default platno
