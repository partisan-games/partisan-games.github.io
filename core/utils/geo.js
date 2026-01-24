function findMinMaxCoordinates(mesta, margin = 0.1) {
  let latMin = Infinity
  let latMax = -Infinity
  let lngMin = Infinity
  let lngMax = -Infinity

  for (const kljuc in mesta) {
    const mesto = mesta[kljuc]
    if (!mesto.koordinate) continue

    const { lat, lng } = mesto.koordinate

    if (lat < latMin) latMin = lat
    if (lat > latMax) latMax = lat
    if (lng < lngMin) lngMin = lng
    if (lng > lngMax) lngMax = lng
  }

  // Dodavanje margine (proširenje opsega)
  const latPadding = (latMax - latMin) * margin
  const lngPadding = (lngMax - lngMin) * margin

  return {
    latRange: { min: latMin - latPadding, max: latMax + latPadding },
    lngRange: { min: lngMin - lngPadding, max: lngMax + lngPadding }
  }
}

export function dodajProcente(scene) {
  function calculatePercentage(koordinate, latRange, lngRange) {
    const y = 1 - (koordinate.lat - latRange.min) / (latRange.max - latRange.min)
    const x = (koordinate.lng - lngRange.min) / (lngRange.max - lngRange.min)

    return { y, x }
  }

  const { latRange, lngRange } = findMinMaxCoordinates(scene, 0.1) // 10% margine

  for (const kljuc in scene) {
    const scena = scene[kljuc]
    if (!scena.koordinate) continue
    scena.procenti = calculatePercentage(scena.koordinate, latRange, lngRange)
  }
}