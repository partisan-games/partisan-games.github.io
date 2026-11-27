import { Box3, MathUtils, TextureLoader } from 'three'
import WarDebris, { createScorch, scorchPicture, warDebris } from '/core3d/actor/buildings/WarDebris.js'
import { assets } from '/config.js'

/**
 * What the bombing of that morning left round the churchyard, from `near` to `far` metres off: burnt patches where
 * the bombs fell, three of them still smoking at `fires`, and barrels and ammunition boxes strewn about.
 */
const traces = { near: 14, far: 70, scorches: 12, scorch: [2.5, 5], fire: 4.5, litter: 18 }
const litter = ['barrel', 'ammunition-box']
const fires = [{ x: 25, z: -19 }, { x: -31, z: 15 }, { x: 47, z: 25 }]

/** What to load; the game awaits requestModels(models) before it places the traces. */
export const models = litter.map(kind => warDebris[kind].model)

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
 * and the houses. Gives what to show and the `fires`, each a point with its ground `base`, where smoke rises.
 */
export default function placeWarTraces(taken, random = seeded(525), groundAt = () => 0) {
  const meshes = []
  const spot = () => {
    const distance = MathUtils.lerp(traces.near, traces.far, random()), angle = random() * Math.PI * 2
    return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
  }
  const clearOf = (blocks, box) => !blocks.some(block => overlap(block, box))
  const scorchMap = new TextureLoader().load(assets.images + scorchPicture)
  const scorch = (x, z, size, yaw) => {
    const mesh = createScorch(size, scorchMap)
    mesh.position.set(x, mesh.position.y + groundAt(x, z), z)
    mesh.rotation.z = yaw
    meshes.push(mesh)
  }
  for (let i = 0; i < traces.scorches; i++) {
    const { x, z } = spot()
    const size = MathUtils.lerp(...traces.scorch, random()), yaw = random() * Math.PI * 2
    const base = groundAt(x, z)
    if (Math.abs(base - groundAt(x + 2, z)) < .07 && Math.abs(base - groundAt(x, z + 2)) < .07) scorch(x, z, size, yaw)
  }
  for (const { x, z } of fires) scorch(x, z, traces.fire, random() * Math.PI * 2)
  const place = kind => {
    for (let tries = 0; tries < 20; tries++) {
      const { mesh: debris } = new WarDebris(kind)
      const { x, z } = spot()
      debris.position.x = x
      debris.position.z = z
      debris.rotation.y = random() * Math.PI * 2
      const box = new Box3().setFromObject(debris)
      if (!clearOf(taken, { min: box.min, max: box.max })) continue
      debris.position.y = groundAt(x, z)
      meshes.push(debris)
      return
    }
  }
  for (let i = 0; i < traces.litter; i++) place(litter[i % litter.length])
  return { meshes, fires: fires.map(({ x, z }) => ({ x, z, base: groundAt(x, z) })) }
}
