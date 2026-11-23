import * as THREE from 'three'
import { assets } from '/config.js'

export default function dressFighter(figure, outfit, textures = new Map(), hatColor) {
  if (!outfit && hatColor === undefined) return
  function replace(material) {
    const swatch = outfit?.[material.name]
    if (swatch === undefined) return material
    const dressed = material.clone()
    if (typeof swatch === 'number') dressed.color.setHex(swatch)
    else {
      if (!textures.has(swatch)) {
        const map = new THREE.TextureLoader().load(assets.models + 'character/soldier/' + swatch)
        map.colorSpace = THREE.SRGBColorSpace
        const original = material.map
        if (original) {
          map.wrapS = original.wrapS
          map.wrapT = original.wrapT
          map.offset.copy(original.offset)
          map.repeat.copy(original.repeat)
          map.rotation = original.rotation
          map.center.copy(original.center)
          map.flipY = original.flipY
        }
        textures.set(swatch, map)
      }
      dressed.map = textures.get(swatch)
    }
    return dressed
  }
  figure.traverse(part => {
    if (part.isMesh)
      part.material = Array.isArray(part.material) ? part.material.map(replace) : replace(part.material)
  })
  if (hatColor !== undefined) colorHat(figure, hatColor)
}

function colorHat(figure, color) {
  figure.traverse(part => {
    if (!part.isSkinnedMesh || !Array.isArray(part.material)) return
    const head = part.skeleton.bones.findIndex(bone => bone.name.replace(':', '') === 'mixamorigHead')
    const original = part.material.findIndex(material => material.name === 'army.green')
    const { geometry } = part
    const joints = geometry.getAttribute('skinIndex'), weights = geometry.getAttribute('skinWeight')
    if (head < 0 || original < 0 || !joints || !weights || !geometry.index) return
    const onHead = vertex => {
      for (let i = 0; i < 4; i++)
        if (joints.getComponent(vertex, i) === head && weights.getComponent(vertex, i) > .35) return true
      return false
    }
    part.geometry = geometry.clone()
    part.material = [...part.material, part.material[original].clone()]
    const hat = part.material.length - 1
    part.material[hat].color.setHex(color)
    part.geometry.clearGroups()
    for (const group of geometry.groups) {
      let { start } = group, current = -1
      for (let i = group.start; i < group.start + group.count; i += 3) {
        const material = group.materialIndex === original && [0, 1, 2].every(n => onHead(geometry.index.getX(i + n))) ? hat : group.materialIndex
        if (material !== current) {
          if (current !== -1) part.geometry.addGroup(start, i - start, current)
          start = i
          current = material
        }
      }
      if (current !== -1) part.geometry.addGroup(start, group.start + group.count - start, current)
    }
  })
}
