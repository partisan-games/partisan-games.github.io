import { shuffle } from '/core3d/helpers.js'

export function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

export function nasumicnoOkruglo(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export const randSpread = range => range * (Math.random() - Math.random())

const randFloatSpread = range => (Math.random() - 0.5) * range

export const getRandomCoords = ({
  n, width = window.innerWidth, height = window.innerHeight, fieldSize = 100, margin = 0, offSet = 0
} = {}) => {
  const coords = []
  for (let x = margin; x < width - margin; x += fieldSize)
    for (let y = margin; y < height - margin; y += fieldSize) {
      const xOffset = randFloatSpread(offSet), zOffset = randFloatSpread(offSet)
      coords.push({ x: x + xOffset, y: y + zOffset })
    }

  shuffle(coords)
  return n ? coords.slice(0, n) : coords
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

