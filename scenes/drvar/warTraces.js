import { Box3, MathUtils, TextureLoader } from 'three'
import WarDebris, { createScorch, scorchPicture } from '/core3d/actor/buildings/WarDebris.js'
import { assets } from '/config.js'

/**
 * What the bombing of that morning left round the churchyard, from `near` to `far` metres off: burnt patches where
 * the bombs fell, trucks thrown over on their sides, barrels and ammunition boxes strewn about.
 */
const traces = { near: 14, far: 70, scorches: 12, scorch: [2.5, 5], wrecks: 4, litter: 18 }
const litter = ['barrel', 'ammunition-box']
const wreckSites = [{ x: 25, z: -19 }, { x: -31, z: 15 }, { x: 47, z: 25 }, { x: -32, z: -17 }]

/** A random number from 0 to 1 that repeats from its `seed`, so the traces lie the same each game. */
function seeded(seed) {
  let state = seed
  return () => {
    state = Math.imul(1664525, state) + 1013904223 | 0
    return (state >>> 0) / 4294967296
  }
}

const overlap = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z

/**
 * The traces of the war on the ground round the stronghold, kept off the `taken` ground `{ min, max }`, as the yard
 * and the houses. Gives what to show and the ground each wreck covers, with its `height`, which stops men and shots.
 */
export default function placeWarTraces(taken, random = seeded(525), groundAt = () => 0) {
  const meshes = [], footprints = []
  const spot = () => {
    const distance = MathUtils.lerp(traces.near, traces.far, random()), angle = random() * Math.PI * 2
    return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
  }
  const clearOf = (blocks, box) => !blocks.some(block => overlap(block, box))
  const scorchMap = new TextureLoader().load(assets.images + scorchPicture)
  for (let i = 0; i < traces.scorches; i++) {
    const { x, z } = spot()
    const size = MathUtils.lerp(...traces.scorch, random()), yaw = random() * Math.PI * 2
    const base = groundAt(x, z)
    if (Math.abs(base - groundAt(x + 2, z)) < .07 && Math.abs(base - groundAt(x, z + 2)) < .07) {
      const scorch = createScorch(size, scorchMap)
      scorch.position.x = x
      scorch.position.z = z
      scorch.rotation.z = yaw
      scorch.position.y += base
      meshes.push(scorch)
    }
  }
  const place = (kind, wreck, anchor) => {
    for (let tries = 0; tries < 20; tries++) {
      const { mesh: debris } = new WarDebris(kind)
      const { x, z } = tries === 0 && anchor ? anchor : spot()
      debris.position.x = x
      debris.position.z = z
      debris.rotation.y = random() * Math.PI * 2
      const box = new Box3().setFromObject(debris)
      const base = groundAt(x, z)
      const footprint = { min: { x: box.min.x, z: box.min.z }, max: { x: box.max.x, z: box.max.z }, height: box.max.y, base }
      if (!clearOf([...taken, ...footprints], footprint)) continue
      debris.position.y = base
      meshes.push(debris)
      if (wreck) footprints.push(footprint)
      return
    }
  }
  for (let i = 0; i < traces.wrecks; i++) place('burnt-truck', true, wreckSites[i])
  for (let i = 0; i < traces.litter; i++) place(litter[i % litter.length], false)
  if (!meshes.some(mesh => mesh.material?.map === scorchMap)) scorchMap.dispose()
  return { meshes, footprints }
}
