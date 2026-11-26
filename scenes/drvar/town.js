import { Box3, Mesh, MeshLambertMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'
import TownHouse from '/core3d/actor/buildings/TownHouse.js'
import { createTexture } from '/core3d/helpers.js'

/**
 * Drvar on 25 May 1944, after the map of the raid in docs/references/ww2-yu/drvar: north is -z and east +x, the
 * churchyard of the stronghold "Moskva" at the middle. The Unac runs east of it, north to south; the main road runs
 * by its east side, south into the heart of the town and north over the river to the cave; the road from its west gate
 * leads to the cemetery hill of Šobića glavica. Each road and the river is `{ min: { x, z }, max: { x, z } }`.
 */
export const roads = [
  { min: { x: 27, z: -260 }, max: { x: 33, z: 260 } },
  { min: { x: 33, z: -153 }, max: { x: 170, z: -147 } },
  { min: { x: -230, z: -3 }, max: { x: -13, z: 3 } },
  { min: { x: -50, z: 107 }, max: { x: 27, z: 113 } },
  { min: { x: -30, z: 167 }, max: { x: 27, z: 173 } },
  { min: { x: 60, z: 60 }, max: { x: 66, z: 230 } },
  { min: { x: 33, z: 137 }, max: { x: 60, z: 143 } },
]
export const river = { min: { x: 92, z: -300 }, max: { x: 110, z: 300 } }

/** The open ground round the churchyard where the fight is; within `ruinsWithin` metres the bombs left mostly ruins. */
const open = { min: { x: -22, z: -20 }, max: { x: 22, z: 20 } }
const ruinsWithin = 70

/** The houses of the little town: the whole ones low and a few of two floors and more, and the bombed ones. */
const kinds = {
  low: ['rock-house', 'simple-house', 'old-house', 'common-house', 'house', 'cabin'],
  tall: ['cornershop', 'storey-house', 'building', 'apartment', 'european-building'],
  ruin: ['ruins-building', 'ruined-building'],
}
/** Near the churchyard most houses are ruins; farther off a few are. */
const ruinChance = { near: .85, far: .15 }
const tallChance = .2
/** Metres between neighbours and back from the road, and the chance of an empty plot of `plot` metres. */
const gap = [2, 6], setback = 2, plot = { chance: .2, length: 10 }
/** Only the houses within this many metres of the churchyard are built; farther off the town is out of the fight. */
const reach = 230

/** A random number from 0 to 1 that repeats from its `seed`, so the town stands the same each game. */
function seeded(seed) {
  let state = seed
  return () => {
    state = Math.imul(1664525, state) + 1013904223 | 0
    return (state >>> 0) / 4294967296
  }
}

const overlap = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z

/** A flat strip of ground showing `file`, a picture `tile` metres across, `lift` metres over the strip `{ min, max }`. */
function strip({ min, max }, file, tile, lift) {
  const width = max.x - min.x, depth = max.z - min.z
  const map = createTexture({ file })
  map.colorSpace = SRGBColorSpace
  map.wrapS = map.wrapT = RepeatWrapping
  map.repeat.set(width / tile, depth / tile)
  const mesh = new Mesh(new PlaneGeometry(width, depth), new MeshLambertMaterial({ map }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set((min.x + max.x) / 2, lift, (min.z + max.z) / 2)
  mesh.receiveShadow = true
  return mesh
}

/**
 * The town round the stronghold, its houses already loaded: houses packed along both sides of each road, their long
 * side along it, kept off the other roads, the river and the open ground round the churchyard. Gives the houses, the
 * strips of the roads and the river, and the ground each house covers, `{ min: { x, z }, max: { x, z }, height }`.
 */
export default function buildTown(random = seeded(1944)) {
  const houses = [], footprints = []
  const pick = list => list[Math.floor(random() * list.length)]
  const kept = [open, river, ...roads]
  for (const road of roads) {
    const along = road.max.x - road.min.x > road.max.z - road.min.z ? 'x' : 'z'
    const across = along === 'x' ? 'z' : 'x'
    for (const side of [-1, 1]) {
      const edge = side < 0 ? road.min[across] - setback : road.max[across] + setback
      for (let cursor = road.min[along]; cursor < road.max[along];) {
        const at = { [along]: cursor, [across]: edge }
        if (random() < plot.chance || Math.hypot(at.x, at.z) > reach) {
          cursor += plot.length
          continue
        }
        const ruin = random() < (Math.hypot(at.x, at.z) < ruinsWithin ? ruinChance.near : ruinChance.far)
        const house = new TownHouse(pick(ruin ? kinds.ruin : random() < tallChance ? kinds.tall : kinds.low))
        const size = new Box3().setFromObject(house.mesh).getSize(house.mesh.position.clone())
        // its long side along the road, its front either way
        const lengthwise = along === 'z' ? size.z >= size.x : size.x >= size.z
        house.mesh.rotation.y = (lengthwise ? 0 : Math.PI / 2) + (random() < .5 ? Math.PI : 0)
        const length = Math.max(size.x, size.z), depth = Math.min(size.x, size.z)
        house.mesh.position[along] = cursor + length / 2
        house.mesh.position[across] = edge + side * depth / 2
        const box = new Box3().setFromObject(house.mesh)
        const footprint = { min: { x: box.min.x, z: box.min.z }, max: { x: box.max.x, z: box.max.z }, height: box.max.y }
        if (cursor + length <= road.max[along] && ![...kept, ...footprints].some(taken => overlap(taken, footprint))) {
          footprints.push(footprint)
          houses.push(house)
        }
        cursor += length + gap[0] + random() * (gap[1] - gap[0])
      }
    }
  }
  const ground = [...roads.map(road => strip(road, 'terrain/dirt.jpg', 6, .02)), strip(river, 'water512.jpg', 12, .03)]
  return { houses, ground, footprints }
}
