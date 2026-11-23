// Cache copies by source geometry; source meshes, attributes and material slots stay untouched.
const grouped = new WeakMap()

function groupMaterials(source) {
  if (grouped.has(source)) return grouped.get(source)
  const batches = new Map()
  for (const group of source.groups) {
    if (!batches.has(group.materialIndex)) batches.set(group.materialIndex, [])
    const indices = batches.get(group.materialIndex)
    for (let i = group.start; i < group.start + group.count; i++) indices.push(source.index ? source.index.getX(i) : i)
  }
  const geometry = source.clone(), index = []
  geometry.clearGroups()
  for (const [material, indices] of batches) {
    geometry.addGroup(index.length, indices.length, material)
    for (const vertex of indices) index.push(vertex)
  }
  geometry.setIndex(index)
  grouped.set(source, geometry)
  return geometry
}

/** Reduce material submissions on this figure, without simplifying its triangles or changing its bones. */
export default function optimizeGeometry(figure) {
  figure.traverse(part => {
    if (!part.isMesh) return
    const { geometry, material } = part
    // Opaque triangles may be regrouped by their material. Transparent draw order must remain intact.
    if (Array.isArray(material) && material.every(item => !item.transparent) &&
      geometry.groups.length > material.length * 2 && geometry.drawRange.start === 0 && geometry.drawRange.count === Infinity)
      part.geometry = groupMaterials(geometry)
  })
}
