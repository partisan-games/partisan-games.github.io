import { MathUtils, Vector3 } from 'three'

// FBXLoader expands the mesh into three vertices per triangle. These are the
// hood's two surfaces and the oriented seam left on the back of that mesh.
const hoodFaces = new Set([
  498, 988, 989, 1170, 1171, 1712, 1713, 1714, 1727, 1781, 1868, 1869, 1870,
  2009, 2010, 2051, 2052, 3856, 3857, 3858, 3859, 3860, 3954, 3955, 4211, 4212,
  4236, 4237, 4238, 4239, 4240, 4241, 4412, 4413, 4415, 4416, 4417, 4418,
  4663, 4664, 4982, 4983, 5654, 5655,
])
const blouseSeam = [
  3511, 3513, 11866, 5608, 5610, 12712, 12714, 13249,
  13255, 13245, 5183, 5140, 5142, 5136, 6030, 14949,
]
// This unused hood vertex already follows the upper spine at full weight.
const backCenter = 12724

/** Replace the hood on the catalogue look with a closed back and low collar. */
export default function shapeSavoBlouse(figure) {
  const torso = figure.getObjectByName('Partisan')
  const source = torso.geometry
  if (source.index || source.attributes.position.count !== 17712) return

  const geometry = source.clone()
  const { position, normal, uv } = geometry.attributes
  const cloth = torso.material.findIndex(material => material.name === 'army.green')
  if (cloth < 0) return
  const groups = new Map()
  for (const { start, count, materialIndex } of source.groups) {
    if (!groups.has(materialIndex)) groups.set(materialIndex, [])
    const vertices = groups.get(materialIndex)
    for (let i = start; i < start + count; i += 3)
      if (!hoodFaces.has(i / 3)) vertices.push(i, i + 1, i + 2)
  }

  const edge = blouseSeam.map(i => new Vector3().fromBufferAttribute(position, i))
  const point = new Vector3()
  const back = new Vector3()
  const prev = new Vector3()
  const smooth = MathUtils.smoothstep
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i)
    if (point.x < .037 || point.y < .61 || point.y > .95 || Math.abs(point.z) > .26) continue

    // Update all copies at a shared edge, including the already split UV islands.
    const distance = Math.min(...edge.map(p => point.distanceTo(p)))
    if (distance < .00001) {
      const lowerBack = 1 - smooth(point.y, .662, .73)
      const nape = smooth(point.y, .916, .946) * (1 - smooth(Math.abs(point.z), 0, .115))
      position.setXYZ(i, point.x - .015 * lowerBack - .021 * nape, point.y - .025 * nape, point.z)
    }
    const blend = 1 - smooth(distance, .00001, .065)
    if (blend === 0) continue
    back.set(1, .37, point.z * 3).normalize()
    prev.fromBufferAttribute(normal, i).lerp(back, blend).normalize()
    normal.setXYZ(i, prev.x, prev.y, prev.z)
  }
  position.setXYZ(backCenter, .126, .8029, 0)
  normal.setXYZ(backCenter, .938, .347, 0)
  for (const i of [...blouseSeam, backCenter])
    uv.setXY(i, .5, .5)
  const panel = groups.get(cloth)
  for (const [i, vertex] of blouseSeam.entries())
    panel.push(vertex, blouseSeam[(i + 1) % blouseSeam.length], backCenter)

  const indices = []
  geometry.clearGroups()
  for (const [material, vertices] of groups) {
    geometry.addGroup(indices.length, vertices.length, material)
    indices.push(...vertices)
  }
  geometry.setIndex(indices)
  torso.geometry = geometry
}
