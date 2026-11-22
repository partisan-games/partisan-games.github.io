import { DoubleSide, Vector3 } from 'three'

// On soldier.fbx, -X is the brow and +Z is across the head. Slot 4 is the chin strap;
// slot 8 contains both sides of the shell lip. Keep its UVs, closed edges and bone weights.
export default function shapeM33(figure) {
  figure.traverse(part => {
    if (!part.isSkinnedMesh || !Array.isArray(part.material)) return
    const slot = part.material.findIndex(material => material.name === 'mat_8-Helmet.jpg')
    if (slot < 0) return
    const geometry = part.geometry.clone()
    const positions = geometry.attributes.position
    const normals = geometry.attributes.normal
    const point = new Vector3(), normal = new Vector3()
    for (const group of geometry.groups) {
      if (group.materialIndex !== slot) continue
      for (let i = group.start; i < group.start + group.count; i++) {
        // The FBX loader expands polygon corners, including the shell's inner rim.
        point.fromBufferAttribute(positions, i)
        const angle = Math.atan2((point.z - .005) / .154, point.x / .19)
        const fore = Math.cos(angle), side = Math.sin(angle)
        const oldRim = .993 - .106 * fore
        const height = Math.max(0, Math.min(1, (point.y - oldRim) / (1.223 - oldRim)))
        const lip = .008 * (1 - height) ** 8
        const radius = Math.sqrt(1 - height * height)
        const rim = 1.013 - .044 * fore
        // Retain some of the original cross-section so the inner and outer lip stay distinct.
        positions.setXYZ(i, .8 * (.193 * radius + lip) * fore + .2 * point.x,
          .8 * (rim + (1.228 - rim) * height) + .2 * point.y,
          .8 * (.005 + (.161 * radius + lip) * side) + .2 * point.z)
        normal.set(radius * fore / .193, height / (1.228 - rim), radius * side / .161).normalize()
        normals.setXYZ(i, normal.x, normal.y, normal.z)
      }
    }
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    part.geometry = geometry
    // The Italian outfit owns this tinted material. Keep the steel free of the source helmet's detailing.
    part.material[slot].map = null
    for (const material of part.material) {
      if (!['mat_4-Helmet.jpg', 'mat_8-Helmet.jpg'].includes(material.name)) continue
      // The source helmet has an open rim, so its inner shell must render the back face too.
      material.side = DoubleSide
      material.needsUpdate = true
    }
  })
}
