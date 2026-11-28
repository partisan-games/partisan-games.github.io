import { Box3, Matrix3, Matrix4, NearestFilter, NearestMipmapLinearFilter, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { assets } from '/config.js'

const paintedHull = /^Fuselage(Main|Bottom|DarkGrey)(?:_NONE)?$/
const film = 'varying vec3 vLiberatorPoint;\nvarying vec3 vLiberatorNormal;\n'

function paint(original, project, direction, maps) {
  const material = original.clone()
  material.roughness = .78
  material.metalness = 0
  material.customProgramCacheKey = () => 'liberator-airframe'
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      liberatorProject: { value: project }, liberatorDirection: { value: direction },
      liberatorDeck: { value: maps[0] }, liberatorBelly: { value: maps[1] }, liberatorSide: { value: maps[2] },
    })
    shader.vertexShader = 'uniform mat4 liberatorProject;\nuniform mat3 liberatorDirection;\n' + film
      + shader.vertexShader.replace('#include <begin_vertex>', /* glsl */ `
        #include <begin_vertex>
        vLiberatorPoint = (liberatorProject * vec4(position, 1.0)).xyz;
        vLiberatorNormal = liberatorDirection * normal;
      `)
    shader.fragmentShader = 'uniform sampler2D liberatorDeck, liberatorBelly, liberatorSide;\n' + film
      + shader.fragmentShader.replace('#include <map_fragment>', /* glsl */ `
        #include <map_fragment>
        {
          vec3 point = clamp(vLiberatorPoint, 0.0, 1.0);
          vec3 normal = normalize(vLiberatorNormal);
          vec2 plan = vec2(point.x, 1.0 - point.z);
          vec3 deck = texture2D(liberatorDeck, plan).rgb;
          vec3 belly = texture2D(liberatorBelly, plan).rgb;
          vec3 side = texture2D(liberatorSide, point.zy).rgb;
          float edgeHeight = smoothstep(0.25, 0.36, point.y);
          float over = smoothstep(-0.27, 0.27, normal.y + (edgeHeight - 0.5) * 0.23);
          float center = 1.0 - smoothstep(0.035, 0.056, abs(point.x - 0.5));
          float tail = smoothstep(0.84, 0.92, point.z) * smoothstep(0.52, 0.65, point.y);
          float sideWeight = max(center, tail) * smoothstep(0.14, 0.8, abs(normal.x));
          diffuseColor.rgb = mix(mix(belly, deck, over), side, sideWeight);
        }
      `)
  }
  return material
}

/** Fit three painted views to the rigid model even where its stock UVs collapse. */
export async function liberatorLooks(mesh, scope) {
  const loader = new TextureLoader()
  const folder = assets.models + 'aircraft/consolidated-b-24-liberator/pixel-art/'
  const maps = await Promise.all(['deck', 'belly', 'side'].map(async name => {
    const map = await loader.loadAsync(folder + name + '.webp')
    map.colorSpace = SRGBColorSpace
    map.magFilter = NearestFilter
    map.minFilter = NearestMipmapLinearFilter
    scope.add(() => map.dispose())
    return map
  }))

  mesh.updateWorldMatrix(true, true)
  const inverse = mesh.matrixWorld.clone().invert()
  const bounds = new Box3()
  const parts = []
  mesh.traverse(part => {
    if (!part.isMesh || !paintedHull.test(part.material.name)) return
    part.geometry.computeBoundingBox()
    const local = inverse.clone().multiply(part.matrixWorld)
    bounds.union(part.geometry.boundingBox.clone().applyMatrix4(local))
    parts.push({ part, local, original: part.material })
  })
  const size = bounds.getSize(new Vector3())
  const fit = new Matrix4().makeScale(1 / size.x, 1 / size.y, 1 / size.z)
    .multiply(new Matrix4().makeTranslation(-bounds.min.x, -bounds.min.y, -bounds.min.z))
  const appearances = parts.map(({ part, local, original }) => {
    const painted = paint(original, fit.clone().multiply(local), new Matrix3().getNormalMatrix(local), maps)
    scope.add(() => painted.dispose())
    return { part, original, painted }
  })
  return pixelArt => {
    for (const { part, original, painted } of appearances)
      part.material = pixelArt ? painted : original
  }
}
