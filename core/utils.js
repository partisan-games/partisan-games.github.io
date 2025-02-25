export function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

export function nasumicnoOkruglo(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export function slucajnePozicije(n, velicinaPolja) {
  const rows = Math.floor(window.innerHeight / velicinaPolja)
  const cols = Math.floor(window.innerWidth / velicinaPolja)
  const allPositions = []

  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      allPositions.push([i, j])

  // Fisher-Yates shuffle for better randomness
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]]
  }

  return allPositions
    .slice(0, n)
    .map(([i, j]) => ({
      y: velicinaPolja * i + velicinaPolja / 2,
      x: velicinaPolja * j + velicinaPolja / 2
    }))
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
