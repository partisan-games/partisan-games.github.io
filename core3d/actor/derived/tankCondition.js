import { Box3, Matrix4, NearestFilter, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { assets } from '/config.js'

let paint
const plateMaps = new Map()

function armorPaint() {
  if (!paint) {
    const loader = new TextureLoader()
    paint = ['armor-hits.webp', 'armor-wreck.webp'].map(file => {
      const map = loader.load(assets.models + 'tank/condition/' + file)
      map.colorSpace = SRGBColorSpace
      map.magFilter = NearestFilter
      return map
    })
  }
  return paint
}

function paintedMap(file) {
  if (!plateMaps.has(file)) {
    const map = new TextureLoader().load(file)
    map.colorSpace = SRGBColorSpace
    map.magFilter = NearestFilter
    plateMaps.set(file, map)
  }
  return plateMaps.get(file)
}

const plateSampling = /* glsl */ `
  uniform sampler2D armorPlates;
  vec4 armorPlate(vec2 point, vec2 tile) {
    const float inset = 4.5 / 256.0;
    vec2 uv = mix(vec2(inset), vec2(1.0 - inset), clamp(point, 0.0, 1.0));
    return texture2D(armorPlates, (tile + uv) * 0.5);
  }
`

const plateColor = /* glsl */ `
  vec3 direction = normalize(vArmorDirection);
  vec4 sidePlate = armorPlate(vArmorPoint.zy, vec2(0.0, 1.0));
  vec4 endPlate = armorPlate(vArmorPoint.xy, direction.z < 0.0 ? vec2(1.0, 1.0) : vec2(0.0, 0.0));
  vec4 topPlate = armorPlate(vArmorPoint.zx, vec2(1.0, 0.0));
  vec3 weights = pow(abs(direction), vec3(4.0));
  weights /= max(dot(weights, vec3(1.0)), 0.001);
  weights *= vec3(sidePlate.a, topPlate.a * step(0.0, direction.y), endPlate.a);
  diffuseColor.rgb = diffuseColor.rgb * (1.0 - dot(weights, vec3(1.0)))
    + sidePlate.rgb * weights.x + topPlate.rgb * weights.y + endPlate.rgb * weights.z;
`

/** Register the drawn armor damage on the existing surfaces, including across UV seams. */
function paintArmor(material, projection, condition, plates, truckWreck) {
  const surface = material.clone()
  const [hits, wreck] = truckWreck ? [truckWreck, truckWreck] : armorPaint()
  const varyings = 'varying vec3 vArmorPoint;\nvarying vec3 vArmorDirection;\n'
  surface.customProgramCacheKey = () => plates ? 'tank-finish-plates' : 'tank-finish'
  surface.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      armorProjection: { value: projection }, armorCondition: condition,
      armorHits: { value: hits }, armorWreck: { value: wreck },
    })
    if (plates) shader.uniforms.armorPlates = { value: plates }
    shader.vertexShader = 'uniform mat4 armorProjection;\n' + varyings
      + shader.vertexShader.replace('#include <begin_vertex>', /* glsl */ `
        #include <begin_vertex>
        vArmorPoint = (armorProjection * vec4(position, 1.0)).xyz;
        vArmorDirection = normalize(mat3(armorProjection) * normal);
      `)
    shader.fragmentShader = 'uniform sampler2D armorHits, armorWreck;\nuniform int armorCondition;\n' + varyings
      + (plates ? plateSampling : '')
      + shader.fragmentShader.replace('#include <map_fragment>', /* glsl */ `
        #include <map_fragment>
        ${plates ? plateColor : ''}
        if (armorCondition > 0) {
          vec2 side = vec2(vArmorPoint.z, vArmorPoint.y);
          vec2 end = vec2(vArmorPoint.x, vArmorPoint.y);
          vec3 direction = abs(normalize(vArmorDirection));
          vec4 scar = texture2D(armorHits, side);
          vec4 endScar = texture2D(armorHits, end);
          if (armorCondition == 2) {
            scar = texture2D(armorWreck, side);
            endScar = texture2D(armorWreck, end);
            diffuseColor.rgb *= vec3(0.72, 0.65, 0.58);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, scar.rgb, scar.a * direction.x);
          diffuseColor.rgb = mix(diffuseColor.rgb, endScar.rgb, endScar.a * direction.z);
        }
      `)
  }
  return surface
}

/** Paint intact or damaged surfaces on one vehicle instance without touching its source model. */
export function paintVehicleCondition(mesh, readCondition, { plateFile, wreckFile } = {}) {
    mesh.updateWorldMatrix(true, true)
    const inverse = mesh.matrixWorld.clone().invert()
    const bounds = new Box3()
    const parts = []
    mesh.traverse(part => {
      if (!part.isMesh) return
      part.geometry.computeBoundingBox()
      const local = new Matrix4().multiplyMatrices(inverse, part.matrixWorld)
      bounds.union(part.geometry.boundingBox.clone().applyMatrix4(local))
      parts.push({ part, local, original: part.material })
    })
    if (bounds.isEmpty()) return undefined
    const size = bounds.getSize(new Vector3())
    const fit = new Matrix4().makeScale(1 / size.x, 1 / size.y, 1 / size.z)
      .multiply(new Matrix4().makeTranslation(-bounds.min.x, -bounds.min.y, -bounds.min.z))
    const condition = { value: 0 }
    const plates = plateFile && paintedMap(assets.textures + plateFile)
    const wreck = wreckFile && paintedMap(assets.models + wreckFile)
    for (const { part, local, original } of parts) {
      const project = fit.clone().multiply(local)
      const finish = (material, index = 0) => paintArmor(material, project, condition, index === 0 ? plates : undefined, wreck)
      part.material = Array.isArray(original) ? original.map(finish) : finish(original)
    }
    return {
      update() {
        condition.value = readCondition()
      },
      dispose() {
        for (const { part, original } of parts) {
          for (const material of [].concat(part.material)) material.dispose()
          part.material = original
        }
      },
    }
}

/** Compose travel and authored damage on the same tank instance. */
export default function tankCondition(travel, plateFile) {
  return (mesh, body) => {
    const motion = travel?.(mesh, body)
    const armor = paintVehicleCondition(mesh, () => body.dead ? 2 : body.health.current < body.health.maximum ? 1 : 0, { plateFile })
    return {
      paintedWreck: Boolean(armor),
      update() {
        motion?.update()
        armor?.update()
      },
      dispose() {
        armor?.dispose()
        motion?.dispose()
      },
    }
  }
}
