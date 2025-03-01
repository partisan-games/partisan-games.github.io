import { shuffle } from '/core3d/helpers.js'

export function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

export function nasumicnoOkruglo(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export const getRandomCoords = ({
  n, width = window.innerWidth, height = window.innerHeight, fieldSize = 100, margin = 0
} = {}) => {
  const coords = []
  for (let x = margin; x < width - margin; x += fieldSize)
    for (let y = margin; y < height - margin; y += fieldSize)
      coords.push({ x, y })

  shuffle(coords)
  return n ? coords.slice(0, n) : coords
}

export function slucajnePozicije(n, velicinaPolja, marginaY = 0, marginaX = 0) {
  const availableHeight = window.innerHeight - 2 * marginaY
  const availableWidth = window.innerWidth - 2 * marginaX

  const rows = Math.floor(availableHeight / velicinaPolja)
  const cols = Math.floor(availableWidth / velicinaPolja)

  const positions = new Set()

  while (positions.size < n) {
    const i = Math.floor(Math.random() * rows)
    const j = Math.floor(Math.random() * cols)
    positions.add(`${i},${j}`)
  }

  return Array.from(positions).map(pos => {
    const [i, j] = pos.split(',').map(Number)
    return {
      y: marginaY + velicinaPolja * i + velicinaPolja / 2,
      x: marginaX + velicinaPolja * j + velicinaPolja / 2
    }
  })
}

const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y)

export function nadjiNajdaljeTacke(pozicije) {
  let maxDistance = 0
  let najdaljeTacke = []

  for (let i = 0; i < pozicije.length; i++)
    for (let j = i + 1; j < pozicije.length; j++) {
      const dist = distance(pozicije[i], pozicije[j])
      if (dist > maxDistance) {
        maxDistance = dist
        najdaljeTacke = [pozicije[i], pozicije[j]]
      }
    }

  return najdaljeTacke.sort((a, b) => a.x - b.x)
}
