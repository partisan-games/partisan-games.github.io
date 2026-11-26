import { Box3, Group, MathUtils, TextureLoader, Vector3 } from 'three'
import WarDebris, { createScorch, scorchPicture } from '/core3d/actor/buildings/WarDebris.js'
import { assets } from '/config.js'

/**
 * What the bombing of that morning left round the churchyard, from `near` to `far` metres off: burnt patches where
 * the bombs fell, trucks thrown over on their sides, barrels and ammunition boxes strewn about.
 */
const traces = { near: 14, far: 70, scorches: 16, scorch: [3, 7], wrecks: 6, litter: 24 }
const wrecks = ['truck', 'army-truck']
const litter = ['barrel', 'ammunition-box']

/** A random number from 0 to 1 that repeats from its `seed`, so the traces lie the same each game. */
function seeded(seed) {
  let state = seed
  return () => {
    state = Math.imul(1664525, state) + 1013904223 | 0
    return (state >>> 0) / 4294967296
  }
}

/** The vehicle `mesh` thrown over on its side by a blast: rolled about its long axis, lying on the ground. */
function overturn(mesh) {
  const size = new Box3().setFromObject(mesh).getSize(new Vector3())
  const roll = new Group().add(mesh)
  roll.rotation[size.x >= size.z ? 'x' : 'z'] = Math.PI / 2
  const lying = new Group().add(roll)
  roll.updateMatrixWorld(true)
  roll.position.y = -new Box3().setFromObject(roll).min.y
  return lying
}

const overlap = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z

/**
 * The traces of the war on the ground round the stronghold, kept off the `taken` ground `{ min, max }`, as the yard
 * and the houses. Gives what to show and the ground each wreck covers, with its `height`, which stops men and shots.
 */
export default function placeWarTraces(taken, random = seeded(525)) {
  const meshes = [], footprints = []
  const spot = () => {
    const distance = MathUtils.lerp(traces.near, traces.far, random()), angle = random() * Math.PI * 2
    return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
  }
  const clearOf = (blocks, box) => !blocks.some(block => overlap(block, box))
  const scorchMap = new TextureLoader().load(assets.images + scorchPicture)
  for (let i = 0; i < traces.scorches; i++) {
    const { x, z } = spot()
    const scorch = createScorch(MathUtils.lerp(...traces.scorch, random()), scorchMap)
    scorch.position.x = x
    scorch.position.z = z
    scorch.rotation.z = random() * Math.PI * 2
    meshes.push(scorch)
  }
  const place = (kind, wreck) => {
    for (let tries = 0; tries < 20; tries++) {
      const { mesh } = new WarDebris(kind), debris = wreck ? overturn(mesh) : mesh
      const { x, z } = spot()
      debris.position.x = x
      debris.position.z = z
      debris.rotation.y = random() * Math.PI * 2
      const box = new Box3().setFromObject(debris)
      const footprint = { min: { x: box.min.x, z: box.min.z }, max: { x: box.max.x, z: box.max.z }, height: box.max.y }
      if (!clearOf([...taken, ...footprints], footprint)) continue
      meshes.push(debris)
      if (wreck) footprints.push(footprint)
      return
    }
  }
  for (let i = 0; i < traces.wrecks; i++) place(wrecks[i % wrecks.length], true)
  for (let i = 0; i < traces.litter; i++) place(litter[i % litter.length], false)
  return { meshes, footprints }
}
