import { wagons } from '/core3d/actor/derived/Train.js'

/**
 * The stretch of the Belgrade–Salonika railway that the bomber follows up the valley of the South Morava, in metres:
 * `u` is the distance along the flight from where it begins, `x` the distance across the valley from its middle. It is
 * laid out after the valley, a plain, a gorge as at Grdelica and a plain again, with towns as Niš and Leskovac; it is
 * not a map ([ISTORIJA](../../docs/ISTORIJA.md#dolina-morave-septembar-1944--polazište-za-teren-ratweeka)). The
 * whole of it is the same in every game.
 */

/** The parts of the valley in order: where each begins, the half-width of its flat floor and the height of its hills. */
export const reaches = [
  { from: 0, floor: 260, hills: 38 },
  { from: 2500, floor: 120, hills: 52 },
  { from: 3700, floor: 250, hills: 40 },
]
/** Metres over which one part of the valley turns into the next. */
const blend = 400
/** Metres from the edge of the floor to the top of the hills, and how much farther out the land keeps rising. */
const slope = { run: 150, beyond: .18 }

/** Bounds of the painted ground; it extends past both ends of the playable route. */
export const groundPaint = { width: 900, from: -320, to: 8700 }

/**
 * The Morava: its `half` width, its bed `depth` below the floor and the `banks` round it; it winds `wavelength` metres a
 * turn, `swing` metres to each side, never nearer than `margin` to the hills.
 */
export const river = { half: 12, banks: 5, depth: 4, wavelength: 1300, swing: 150, margin: 45 }
/** The railway runs almost straight up the valley, `swing` metres to each side over `wavelength`. */
export const railway = { swing: 28, wavelength: 2900, piece: 8.04, span: 16.19 }

const smooth = t => t * t * (3 - 2 * t)
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** The floor's half-width and the hills' height at `u`, each part turning into the next over `blend` metres. */
export function valleyAt(u) {
  let { floor, hills } = reaches[0]
  for (const reach of reaches.slice(1)) {
    const t = smooth(clamp((u - reach.from + blend / 2) / blend, 0, 1))
    floor += (reach.floor - floor) * t
    hills += (reach.hills - hills) * t
  }
  return { floor, hills }
}

/** Where the middle of the river is across the valley at `u`. */
export function riverAt(u) {
  const swing = Math.min(river.swing, valleyAt(u).floor - river.margin)
  return swing * Math.sin(2 * Math.PI * u / river.wavelength + .6)
}

/** Where the railway is across the valley at `u`. */
export const railwayAt = u => railway.swing * Math.sin(2 * Math.PI * u / railway.wavelength)

/** A gentle unevenness of the hills, the same at the same place. */
const ripple = (x, u) => Math.sin(x * .031 + u * .017) * Math.sin(u * .023 - x * .011)

/** How far below the floor the river's bed is at `x`, `u`: deepest in its middle, rising over its banks. */
function bedAt(x, u) {
  const off = Math.abs(x - riverAt(u))
  const edge = river.half + river.banks
  return off >= edge ? 0 : river.depth * smooth(1 - off / edge)
}

/** The height of the ground: the flat floor of the valley, the river's bed in it, and the hills on either side. */
export function heightAt(x, u) {
  const { floor, hills } = valleyAt(u)
  const out = Math.abs(x) - floor
  if (out <= 0) return -bedAt(x, u)
  const rise = hills * smooth(Math.min(out / slope.run, 1)) + Math.max(0, out - slope.run) * slope.beyond
  return rise * (1 + .3 * ripple(x, u))
}

/** Whether `x`, `u` is on the dry floor of the valley, `clear` metres from the river and from the hills. */
export function onFloor(x, u, clear = 0) {
  return Math.abs(x) < valleyAt(u).floor - clear && Math.abs(x - riverAt(u)) > river.half + river.banks + clear
}

/** A random number from 0 to 1 that repeats from its `seed`. */
export function seeded(seed) {
  let state = seed >>> 0
  return () => {
    state = state + 0x6D2B79F5 >>> 0
    let t = state
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/**
 * The bridges, where the railway crosses the river: the `u` of the crossing and the `spans` of the bridge, enough
 * for the bridge to reach over the river and its banks as it crosses at its slant, up to `length` metres.
 */
function findBridges(length) {
  const bridges = []
  const gap = u => riverAt(u) - railwayAt(u)
  for (let u = 1; u < length; u++) {
    if (Math.sign(gap(u)) === Math.sign(gap(u - 1))) continue
    const slant = Math.abs(gap(u + 1) - gap(u - 1)) / 2
    const across = 2 * (river.half + river.banks) / Math.max(slant, .05)
    bridges.push({ u, spans: Math.max(2, Math.ceil((across + 6) / railway.span)) })
  }
  return bridges
}

/** How long the route is laid out: longer than the fastest bomber flies in the time of the mission. */
export const routeLength = 8000
export const bridges = findBridges(routeLength)

/** Whether the railway at `u` is on a bridge rather than on its bank. */
export const onBridge = u => bridges.some(bridge => Math.abs(u - bridge.u) <= bridge.spans * railway.span / 2)

/**
 * The towns along the railway, from `from` to `to`: houses on the side of the railway away from the river, a station
 * with `sidings` and trains standing on them, and `factories` by the railway at the far end of the town.
 */
export const towns = [
  { name: 'Niš', from: 1260, to: 1800, sidings: 3, trains: 3, factories: 3 },
  { name: 'Leskovac', from: 4490, to: 4990, sidings: 2, trains: 2, factories: 2 },
]

/** Which side of the railway the town lies on: the side away from the river at its middle. */
export const townSide = town => {
  const middle = (town.from + town.to) / 2
  return riverAt(middle) > railwayAt(middle) ? -1 : 1
}

/** Metres between the tracks of a station, the first siding beside the main line. */
export const sidingGap = 5.5
/**
 * How a town grows: cross `streets` going out from the railway every `apart` metres or so, `width` wide; houses
 * within `reach` metres of the station's street, thinning towards the edge of town, each with a `yard` round it, up to
 * `houses` of them, tried `tries` times each.
 */
const growth = { apart: [55, 95], width: 8, reach: 190, yard: 2, houses: 0.28, tries: 12 }

/** The houses of `town` on the `side` of the railway, from `inner` metres off it: an uneven town round its streets. */
function townHouses(town, side, inner, random, streetLayout) {
  const streets = []
  for (let u = town.from + 20 + random() * 30; u < town.to; u += growth.apart[0] + random() * (growth.apart[1] - growth.apart[0]))
    streets.push(u)
  streetLayout?.set(town.name, { streets, width: growth.width, reach: growth.reach })
  const middle = (town.from + town.to) / 2, half = (town.to - town.from) / 2
  const houses = []
  const wanted = Math.round((town.to - town.from) * growth.houses)
  for (let tries = 0; houses.length < wanted && tries < wanted * growth.tries; tries++) {
    const u = town.from + (town.to - town.from) * random()
    // nearer the railway and the middle of town the houses stand closer together
    const out = growth.reach * random() ** 1.5
    if (random() < Math.abs(u - middle) / half * .55 + out / growth.reach * .35) continue
    const width = 8 + random() * 3, depth = 7 + random() * 4
    const radius = Math.hypot(width, depth) / 2 + growth.yard
    const street = streets.reduce((near, s) => Math.abs(s - u) < Math.abs(near - u) ? s : near, Infinity)
    if (Math.abs(street - u) < growth.width / 2 + radius) continue
    const x = railwayAt(u) + side * (inner + out)
    if (!onFloor(x, u, radius) || houses.some(house => Math.hypot(house.u - u, house.x - x) < house.radius + radius)) continue
    // a house by a cross street fronts on it, the others front towards the railway, each a little askew
    const turn = (Math.abs(street - u) < radius + 6 ? (u > street ? 0 : Math.PI) : -side * Math.PI / 2) + (random() - .5) * .25
    houses.push({ kind: 'house', u, x, width, depth, height: 5 + random() * 6, turn, facade: Math.floor(random() * 3), radius })
  }
  return houses
}

/**
 * What stands along the route, each `{ kind, u, x }` with `kind` one of house, station, factory, train, bridge and
 * tower; a house has its size, its `turn` about the upright, its `facade` and the `radius` its yard keeps clear, a
 * train its `cars` from the locomotive back, a bridge its `spans`. The towns' houses stand on their streets, the stations and trains by the railway, the factories past the
 * towns, and the anti-aircraft towers by the towns and the bridges. The same each game.
 */
export function landmarks(streetLayout) {
  const random = seeded(1944)
  const things = []
  for (const town of towns) {
    const side = townSide(town)
    const middle = (town.from + town.to) / 2
    const yard = { from: middle - 130, to: middle + 130 }
    const stationX = u => railwayAt(u) + side * (sidingGap * (town.sidings + 1) + 8)
    things.push({ kind: 'station', u: middle, x: stationX(middle), width: 9, depth: 30, height: 7 })
    for (let i = 0; i < town.trains; i++) {
      const u = yard.from + 40 + (yard.to - yard.from - 80) * random()
      const cars = ['locomotive', ...Array.from({ length: 2 + Math.floor(random() * 3) }, () => wagons[Math.floor(random() * wagons.length)])]
      things.push({ kind: 'train', u, x: railwayAt(u) + side * sidingGap * (1 + i % town.sidings), cars })
    }
    for (let i = 0; i < town.factories; i++) {
      const u = town.to + 40 + i * 70
      const x = railwayAt(u) + side * (60 + 40 * (i % 2))
      if (onFloor(x, u, 20)) things.push({ kind: 'factory', u, x })
    }
    things.push(...townHouses(town, side, sidingGap * (town.sidings + 1) + 22, random, streetLayout))
    for (const u of [town.from + 100, town.to - 100]) {
      const x = railwayAt(u) - side * 40
      if (onFloor(x, u, 8)) things.push({ kind: 'tower', u, x })
    }
  }
  for (const bridge of bridges) {
    const side = riverAt(bridge.u + 30) > railwayAt(bridge.u + 30) ? -1 : 1
    things.push({ kind: 'bridge', u: bridge.u, x: railwayAt(bridge.u), spans: bridge.spans })
    const u = bridge.u + 70, x = railwayAt(u) + side * 45
    if (onFloor(x, u, 8)) things.push({ kind: 'tower', u, x })
  }
  return things.sort((a, b) => a.u - b.u)
}
