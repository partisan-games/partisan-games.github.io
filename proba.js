const mesta = [
  { 'koordinate': { 'lat': 45.28028223, 'lng': 16.92837349 }, 'title': 'Jasenovac' },
  { 'koordinate': { 'lat': 43.82941295, 'lng': 16.9979416 }, 'title': 'Livno' },
  { 'koordinate': { 'lat': 44.81072023, 'lng': 20.48544102 }, 'title': 'Belgrade' },
  { 'koordinate': { 'lat': 43.65391537, 'lng': 17.76053537 }, 'title': 'Neretva' },
  { 'koordinate': { 'lat': 43.34605402, 'lng': 18.68679495 }, 'title': 'Sutjeska' }
]

const center = [44.341667, 17.269444] // centar mape

// Dinamičko pronalaženje minimalnih i maksimalnih vrednosti za lat i lng
function findMinMaxCoordinates(mesta) {
  let latMin = Infinity
  let latMax = -Infinity
  let lngMin = Infinity
  let lngMax = -Infinity

  mesta.forEach(mesto => {
    const { lat } = mesto.koordinate
    const { lng } = mesto.koordinate

    if (lat < latMin) latMin = lat
    if (lat > latMax) latMax = lat
    if (lng < lngMin) lngMin = lng
    if (lng > lngMax) lngMax = lng
  })

  return { latRange: { min: latMin, max: latMax }, lngRange: { min: lngMin, max: lngMax } }
}

// Funkcija za proračun procenta u opsegu 0-1
function calculatePercentage(koordinate, latRange, lngRange) {
  const latPercent = (koordinate.lat - latRange.min) / (latRange.max - latRange.min)
  const lngPercent = (koordinate.lng - lngRange.min) / (lngRange.max - lngRange.min)

  const clampedLatPercent = Math.min(1, Math.max(0, latPercent))
  const clampedLngPercent = Math.min(1, Math.max(0, lngPercent))

  return { latPercent: clampedLatPercent, lngPercent: clampedLngPercent }
}

// Pronađi opsege za lat i lng
const { latRange, lngRange } = findMinMaxCoordinates(mesta)

// Izračunaj procente za svako mesto
const mestaProcenti = mesta.map(mesto => ({
  title: mesto.title,
  procenti: calculatePercentage(mesto.koordinate, latRange, lngRange)
}))

console.log(mestaProcenti)
