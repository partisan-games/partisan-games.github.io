import { Float32BufferAttribute, MathUtils, ShaderChunk } from 'three'
import { outfitTexture } from '/core3d/actor/characters/dressFighter.js'

export const partisanOutfits = { wool: { '_1___Default': 'partisan-wool-uniform.webp' } }

const { smoothstep } = MathUtils
const band = (value, center, width) => 1 - smoothstep(Math.abs(value - center), 0, width)
const faceMaterial = 'Tex_0534_0_dds'
const eyeMaterial = 'Tex_0532_0_dds'
const texturesByOutfit = new Map()

function uniformDetails(material, { trousersMap, badgeRadius = .039 } = {}) {
  if (trousersMap) material.uniforms = { sutjeskaTrousers: { value: trousersMap } }
  const wool = trousersMap ? /* glsl */ `
    // The atlas shares the trousers' material with the jacket and equipment. Isolate the trouser UVs.
    bool trouserAtlas = (atlas.x < 0.650 && atlas.y >= 0.565) || (atlas.x < 0.668 && atlas.y >= 0.600);
    bool trousers = trouserAtlas && abs(vUniformPosition.x) < 0.35 && vUniformPosition.y < 1.43;
    vec3 wool = texture2D(sutjeskaTrousers, vMapUv).rgb;
    if (trousers) sampledDiffuseColor.rgb = wool;
  ` : ''
  material.onBeforeCompile = shader => {
    shader.uniforms.partisanBadgeRadius = { value: badgeRadius }
    if (trousersMap) shader.uniforms.sutjeskaTrousers = material.uniforms.sutjeskaTrousers
    shader.vertexShader = 'varying vec3 vUniformPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvUniformPosition = position;')
    const trousersSampler = trousersMap ? 'uniform sampler2D sutjeskaTrousers;\n' : ''
    shader.fragmentShader = trousersSampler + 'uniform float partisanBadgeRadius; varying vec3 vUniformPosition;\n' + shader.fragmentShader.replace('#include <map_fragment>',
      ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', /* glsl */ `
        vec2 atlas = vec2(vMapUv.x, 1.0 - vMapUv.y);
        ${wool}
        bool oldBadge = atlas.x > 0.416 && atlas.x < 0.500 && atlas.y > 0.197 && atlas.y < 0.280
          && vUniformPosition.y > 2.375 && vUniformPosition.z > 0.195;
        vec3 capFabric = texture2D(map, vec2(0.346, 0.853)).rgb;
        if (oldBadge) sampledDiffuseColor.rgb = capFabric;
        diffuseColor *= sampledDiffuseColor;

        // Project an upright star on the front of the existing cap in bind space.
        vec2 badge = (vUniformPosition.xy - vec2(-0.003, 2.410)) / partisanBadgeRadius;
        if (vUniformPosition.z > 0.178 && abs(badge.x) < 1.10 && abs(badge.y) < 1.10) {
          const float halfSector = 0.62831853;
          const float inner = 0.455;
          float angle = abs(mod(atan(badge.x, badge.y + 0.00001) + halfSector, 2.0 * halfSector) - halfSector);
          float edge = inner * sin(halfSector) / (inner * sin(halfSector - angle) + sin(angle));
          float depth = edge - length(badge);
          float opacity = smoothstep(-0.035, 0.035, depth);
          vec3 red = mix(vec3(0.36, 0.012, 0.009), vec3(0.71, 0.030, 0.021), smoothstep(0.025, 0.16, depth));
          diffuseColor.rgb = mix(diffuseColor.rgb, red, opacity);
        }
      `))
  }
  material.customProgramCacheKey = () => trousersMap ? 'partisan cap badge and wool trousers' : 'partisan cap badge'
}

/** Apply the cap badge to the material already cloned for the wool outfit. */
export function enlargePartisanCapBadge(figure) {
  const { material } = figure.getObjectByProperty('isSkinnedMesh', true)
  uniformDetails(material.find(({ name }) => partisanOutfits.wool[name]), { badgeRadius: .034 })
}

function replaceDiffuse(material, code) {
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
      ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', code + '\ndiffuseColor *= sampledDiffuseColor;'))
  }
  material.customProgramCacheKey = () => code
}

function brownEyes(material) {
  replaceDiffuse(material, /* glsl */ `
    vec3 eye = sampledDiffuseColor.rgb;
    float radius = length(vMapUv - vec2(0.508, 0.515));
    float iris = smoothstep(0.061, 0.078, radius) * (1.0 - smoothstep(0.155, 0.167, radius));
    float tone = dot(eye, vec3(0.2126, 0.7152, 0.0722));
    float pigment = iris * (1.0 - smoothstep(0.16, 0.38, tone));
    vec3 brown = vec3(0.32, 0.131, 0.038) * clamp(0.36 + 4.5 * tone, 0.36, 1.0);
    sampledDiffuseColor.rgb = mix(eye, brown, pigment);
  `)
}

function chestnutHair(material) {
  replaceDiffuse(material, /* glsl */ `
    vec3 source = sampledDiffuseColor.rgb;
    float side = abs(vMapUv.x - 0.5);
    float down = 1.0 - vMapUv.y;
    float tone = dot(source, vec3(0.2126, 0.7152, 0.0722));
    // The top UV island combines the scalp, temples and face. Keep the nearby skin out of the hair tint.
    float outline = max(1.0 - smoothstep(0.133, 0.163, down), smoothstep(0.112, 0.158, side));
    float hair = outline * (1.0 - smoothstep(0.328, 0.359, down)) * (1.0 - smoothstep(0.064, 0.151, tone));
    float temple = smoothstep(0.139, 0.165, side) * (1.0 - smoothstep(0.181, 0.205, side));
    float trim = temple * smoothstep(0.223, 0.254, down);
    vec3 hairColor = vec3(0.175, 0.074, 0.030) * clamp(0.29 + 7.5 * tone, 0.29, 1.26);
    vec3 skin = texture2D(map, vMapUv - vec2(0.0, 0.063)).rgb;
    sampledDiffuseColor.rgb = mix(source, mix(hairColor, skin, trim), hair);
  `)
}

/** Dress a copy of partisan.fbx with its existing skin weights and UVs. */
export default function dressSutjeska(figure, textures = texturesByOutfit) {
  const skin = figure.getObjectByProperty('isSkinnedMesh', true)
  const geometry = skin.geometry.clone()
  const vertices = geometry.getAttribute('position')
  const face = new Uint8Array(vertices.count)
  for (const { start, count, materialIndex } of geometry.groups) {
    const { name } = skin.material[materialIndex]
    if (name !== faceMaterial && name !== eyeMaterial) continue
    for (let i = start; i < start + count; i++) face[geometry.index ? geometry.index.getX(i) : i] = 1
  }
  const colors = []
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i)
    if (y <= 2.205) {
      colors.push(1, 1, 1)
      continue
    }
    const across = Math.abs(x)
    const front = smoothstep(z, .075, .178)
    const jaw = band(y, 2.240, .051) * front
    const chin = band(y, 2.228, .028) * band(across, 0, .055) * front
    const cheek = band(y, 2.291, .048) * band(across, .070, .046) * front
    const nose = band(across, 0, .044) * band(y, 2.289, .047) * front
    const brow = band(across, .046, .041) * band(y, 2.347, .031) * front
    const mouthCorner = band(y, 2.254, .022) * band(across, .034, .023) * front
    if (face[i] && y < 2.38)
      vertices.setXYZ(i, x * (1 - .155 * jaw + .105 * cheek - .090 * nose),
        y + .009 * chin + .004 * brow + .008 * mouthCorner,
        z - .015 * nose - .004 * chin - .003 * brow + .008 * cheek)
    const eyeLight = band(y, 2.337, .026) * band(across, .053, .040) * front
    const cap = smoothstep(y, 2.379, 2.403)
    const warmth = face[i] * band(y, 2.299, .096) * front
    const light = 1 + face[i] * .07 * eyeLight
    colors.push(light + .05 * warmth - .42 * cap, light - .035 * warmth - .35 * cap, light - .13 * warmth - .32 * cap)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  skin.geometry = geometry
  skin.material = skin.material.map(material => {
    const shaded = material.clone()
    shaded.vertexColors = true
    const wool = partisanOutfits.wool[shaded.name]
    if (wool) uniformDetails(shaded, { trousersMap: outfitTexture(wool, material.map, textures) })
    if (shaded.name === eyeMaterial) brownEyes(shaded)
    if (shaded.name === faceMaterial) chestnutHair(shaded)
    return shaded
  })
}
