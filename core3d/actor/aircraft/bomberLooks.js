import { NearestFilter, NearestMipmapLinearFilter, SRGBColorSpace, TextureLoader } from 'three'
import { assets } from '/config.js'

const mitchellMaps = {
  'DVIG_LEV-FACES': 'engines', 'DVIG_PRAV-FACES': 'engines',
  'KRILO_LEV-FACES': 'left-wing', 'Line02-FACES': 'right-wing',
  'Line03-FACES': 'tailplane', 'Line04-FACES': 'tailplane',
  'Line13-FACES': 'left-fin', 'Line15-FACES': 'right-fin',
  'NOS-FACES': 'nose', 'S_22-FACES': 'fuselage',
}
const lancasterMaps = {
  VMtl09: 'nacelle-a', VMtl15: 'nacelle-a', VMtl28: 'nacelle-a', VMtl51: 'nacelle-a',
  VMtl10: 'nacelle-b', VMtl19: 'nacelle-b', VMtl27: 'nacelle-b', VMtl50: 'nacelle-b',
  VMtl18: 'nose-glass', VMtl20: 'cockpit-glass', VMtl29: 'tail-glass', VMtl36: 'upper-glass',
  VMtl21: 'wing-top-a', VMtl22: 'wing-bottom-a',
  VMtl31: 'fin', VMtl32: 'fin', VMtl33: 'intake-a',
  VMtl37: 'tailplane-a', VMtl38: 'tailplane-b', VMtl39: 'intake-b',
  VMtl42: 'wing-top-b', VMtl43: 'wing-bottom-b',
  VMtl44: 'fuselage-a', VMtl45: 'fuselage-b',
}

/** Replace this instance's materials while keeping its UVs, props and flight state. */
async function bomberLooks(mesh, scope, folder, maps, glazing = []) {
  const materials = new Map(), parts = [], sources = new Map()
  const loader = new TextureLoader()
  function paint(original) {
    if (materials.has(original)) return materials.get(original)
    const name = Object.hasOwn(maps, original.name) && maps[original.name]
    if (!name && !glazing.includes(original.name)) return original
    const material = original.clone()
    materials.set(original, material)
    if (name) sources.set(name, original.map)
    else {
      material.color.setHex(0x6b7e78)
      material.roughness = .32
      material.opacity = .5
    }
    scope.add(() => material.dispose())
    return material
  }
  mesh.traverse(part => {
    if (!part.isMesh) return
    const original = part.material
    const painted = Array.isArray(original) ? original.map(paint) : paint(original)
    parts.push({ part, original, painted })
  })
  const loaded = new Map(await Promise.all([...sources].map(async([name, source]) => {
    const map = await loader.loadAsync(assets.models + `aircraft/${folder}/pixel-art/${name}.webp`)
    map.wrapS = source.wrapS
    map.wrapT = source.wrapT
    map.offset.copy(source.offset)
    map.repeat.copy(source.repeat)
    map.rotation = source.rotation
    map.center.copy(source.center)
    map.flipY = source.flipY
    map.colorSpace = SRGBColorSpace
    map.magFilter = NearestFilter
    map.minFilter = NearestMipmapLinearFilter
    scope.add(() => map.dispose())
    return [name, map]
  })))
  for (const [original, material] of materials) {
    const map = loaded.get(maps[original.name])
    if (map) material.map = map
  }
  return pixelArt => {
    for (const { part, original, painted } of parts)
      part.material = pixelArt ? painted : original
  }
}

export const mitchellLooks = (mesh, scope) => bomberLooks(mesh, scope, 'north-american-b-25-mitchell', mitchellMaps,
  ['Sphere02-FACES', 'TUREL-FACES', 'TUREL01-FACES'])
export const lancasterLooks = (mesh, scope) => bomberLooks(mesh, scope, 'bomber-lancaster', lancasterMaps)
