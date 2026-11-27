import { BufferGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial,
  NearestFilter, NearestMipmapLinearFilter, SRGBColorSpace, TextureLoader } from 'three'
import { assets } from '/config.js'
import { outfitTexture } from '/core3d/actor/characters/dressFighter.js'
import { description as nikoletina, models } from './SovietPartisan.js'

export { models }

// Rings are in the source FBX's coordinates: height, forward, across.
const furRings = [
  [1.061, -.102, .149, .116],
  [1.074, -.104, .156, .123],
  [1.128, -.111, .162, .130],
  [1.197, -.117, .159, .127],
  [1.262, -.125, .143, .115],
  [1.290, -.128, .117, .092],
  [1.297, -.130, .060, .045],
]

function hatMesh(rows, segments, crown) {
  const positions = rows.flat()
  const colors = []
  const indices = []
  for (let row = 0; row < rows.length; row++) for (let col = 0; col < segments; col++) {
    const shade = .88 + .19 * Math.sin(col * 2.4 + row * .7) + .09 * Math.cos(col * 3.9 - row * 1.2)
    const fur = .018 * shade
    colors.push(fur, fur, fur)
    if (row === rows.length - 1) continue
    const a = row * segments + col
    const b = row * segments + (col + 1) % segments
    indices.push(a, b, a + segments, b, b + segments, a + segments)
  }
  const tip = positions.length / 3
  const last = (rows.length - 1) * segments
  positions.push(...crown)
  colors.push(.018, .018, .018)
  for (let col = 0; col < segments; col++)
    indices.push(last + col, last + (col + 1) % segments, tip)
  return headMesh('Šubara', positions, colors, indices)
}

function headMesh(name, positions, colors, indices) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, new MeshStandardMaterial({
    vertexColors: true, flatShading: true, side: DoubleSide, roughness: .94,
  }))
  mesh.name = name
  mesh.castShadow = true
  return mesh
}

function furHat() {
  const segments = 24
  const rows = furRings.map(([height, center, depth, width], row) => Array.from({ length: segments }, (_, col) => {
    const angle = 2 * Math.PI * col / segments
    const nap = 1 + .035 * Math.sin(col * 4.7 + row * 1.5)
    const brow = row === 0 ? .010 * Math.max(0, Math.cos(angle)) : 0
    const crest = .009 * Math.sin(col * 1.6 + row * .6) + brow
    return [height + crest, center + depth * Math.cos(angle) * nap, width * Math.sin(angle) * nap]
  }).flat())
  const hat = hatMesh(rows, segments, [1.299, -.130, 0])
  paintCockade(hat.material)
  return hat
}

let cockadeMap
function paintCockade(material) {
  if (!cockadeMap) {
    cockadeMap = new TextureLoader().load(assets.models + 'character/soldier/chetnik-cockade-m72.webp')
    cockadeMap.colorSpace = SRGBColorSpace
    cockadeMap.magFilter = NearestFilter
  }
  const varyings = 'varying vec2 vCockadeUv;\nvarying float vCockadeFront;\n'
  material.onBeforeCompile = shader => {
    shader.uniforms.chetnikCockade = { value: cockadeMap }
    shader.vertexShader = varyings + shader.vertexShader.replace('#include <begin_vertex>', /* glsl */ `
      #include <begin_vertex>
      vCockadeUv = vec2(0.5 - position.z / 0.042, 0.5 + (position.x - 1.145) / 0.050);
      vCockadeFront = position.y;
    `)
    shader.fragmentShader = 'uniform sampler2D chetnikCockade;\n' + varyings
      + shader.fragmentShader.replace('#include <color_fragment>', /* glsl */ `
        #include <color_fragment>
        vec2 edge = abs(vCockadeUv - 0.5);
        if (vCockadeFront > 0.0 && max(edge.x, edge.y) < 0.5) {
          vec4 badge = texture2D(chetnikCockade, vCockadeUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, badge.rgb, badge.a);
        }
      `)
  }
}

let faceMap
function paintFace(material) {
  if (!faceMap) {
    faceMap = new TextureLoader().load(assets.models + 'character/soldier/chetnik-face.svg')
    faceMap.colorSpace = SRGBColorSpace
  }
  const paintUniform = material.onBeforeCompile
  material.onBeforeCompile = shader => {
    paintUniform(shader)
    shader.uniforms.chetnikFace = { value: faceMap }
    shader.fragmentShader = 'uniform sampler2D chetnikFace;\n' + shader.fragmentShader.replace('diffuseColor *= sampledDiffuseColor;', /* glsl */ `
      vec2 atlasPixel = atlas * 2048.0;
      vec2 face = atlasPixel - vec2(620.0, 570.0);
      vec2 nape = atlasPixel - vec2(1400.0, 34.0);
      bool onFace = all(greaterThanEqual(face, vec2(0.0))) && all(lessThan(face, vec2(560.0, 540.0)));
      bool onNape = all(greaterThanEqual(nape, vec2(0.0))) && all(lessThan(nape, vec2(190.0, 135.0)));
      if (onFace || onNape) {
        vec2 paintedUv = (onNape ? nape + vec2(0.0, 540.0) : face) / vec2(560.0, 675.0);
        vec4 hair = texture2D(chetnikFace, vec2(paintedUv.x, 1.0 - paintedUv.y));
        sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, hair.rgb, hair.a);
      }
      diffuseColor *= sampledDiffuseColor;
    `)
  }
}

function prepareSubara(figure) {
  nikoletina.dress(figure)
  const skin = figure.getObjectByProperty('isSkinnedMesh', true)
  const { geometry } = skin
  const { position, uv } = geometry.attributes
  const isOldCap = i => {
    const u = uv.getX(i), down = 1 - uv.getY(i)
    return position.getX(i) > 1.045 && u > .357 && u < .491 && down > .850 && down < .987
  }
  const visible = []
  // Keep the shared skin weights and texture atlas, drawing only the triangles outside the old cap.
  for (let i = 0; i < position.count; i += 3)
    if (!(isOldCap(i) && isOldCap(i + 1) && isOldCap(i + 2))) visible.push(i, i + 1, i + 2)
  geometry.setIndex(visible)
  const { bones, boneInverses } = skin.skeleton
  const headIndex = bones.findIndex(({ name }) => name === 'mixamorigHead')
  const bindToHead = boneInverses[headIndex].clone().multiply(skin.bindMatrix)
  const hat = furHat()
  bindToHead.decompose(hat.position, hat.quaternion, hat.scale)
  bones[headIndex].add(hat)
  return skin
}

function dressWithSubara(figure) {
  paintFace(prepareSubara(figure).material)
}

export function subaraLooks(figure, scope) {
  const skin = prepareSubara(figure)
  const original = skin.material
  const paintUniform = original.onBeforeCompile
  paintFace(original)
  let pixel
  return enabled => {
    if (enabled && !pixel) {
      pixel = original.clone()
      pixel.onBeforeCompile = paintUniform
      pixel.map = outfitTexture('cetnik-subara-pixel-art.webp', original.map, new Map())
      pixel.map.magFilter = NearestFilter
      pixel.map.minFilter = NearestMipmapLinearFilter
      scope.add(() => {
        pixel.map.dispose()
        pixel.dispose()
      })
    }
    skin.material = enabled ? pixel : original
  }
}

export const description = { ...nikoletina, dress: dressWithSubara }
