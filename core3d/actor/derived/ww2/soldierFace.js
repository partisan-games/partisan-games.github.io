import { Float32BufferAttribute, MathUtils, SRGBColorSpace, TextureLoader } from 'three'
import { assets } from '/config.js'

const band = (value, center, width) => 1 - MathUtils.smoothstep(Math.abs(value - center), 0, width)
let atlas

// Eye line, base of nose and centre of mouth, measured down each painted portrait.
const landmarks = [
  [.27, .56, .72], [.25, .57, .74], [.25, .59, .77], [.26, .59, .75], [.25, .54, .71],
  [.24, .53, .69], [.24, .56, .73], [.23, .58, .75], [.25, .55, .72], [.24, .58, .74],
]

function applyPortrait(material) {
  if (!atlas) {
    atlas = new TextureLoader().load(assets.models + 'character/soldier/italian-portraits.jpg')
    atlas.colorSpace = SRGBColorSpace
  }
  // Blend into the original skin at the temples and neckline; keep its UVs for ears and neck.
  material.onBeforeCompile = shader => {
    shader.uniforms.faceAtlas = { value: atlas }
    shader.vertexShader = 'attribute vec3 portraitUV; varying vec3 vPortrait;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPortrait = portraitUV;')
    shader.fragmentShader = 'uniform sampler2D faceAtlas; varying vec3 vPortrait;\n' +
      shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, texture2D(faceAtlas, vPortrait.xy).rgb, vPortrait.z);')
  }
  material.needsUpdate = true
}

// soldier.fbx faces -X in bind space. Project before reshaping, so the painted features follow
// the skinned vertices through aiming, recoil and death without changes to the original rig.
export default function soldierFace(figure, { portrait, jaw, nose, chin }) {
  const [eye, nostril, mouth] = landmarks[portrait]
  figure.traverse(part => {
    if (!part.isSkinnedMesh || !Array.isArray(part.material)) return
    const { geometry } = part
    const positions = geometry.attributes.position
    let uv
    for (const group of geometry.groups) {
      const material = part.material[group.materialIndex]
      if (!['mat_10-Face.jpg', 'mat_12-Eyes.jpg'].includes(material.name)) continue
      if (!uv) {
        uv = new Float32BufferAttribute(new Float32Array(positions.count * 3), 3)
        geometry.setAttribute('portraitUV', uv)
      }
      applyPortrait(material)
      for (let i = group.start; i < group.start + group.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
        const side = z - .003
        const front = MathUtils.smoothstep(-x, .028, .085)
        const blend = front * (1 - MathUtils.smoothstep(Math.abs(side), .082, .113)) *
          MathUtils.smoothstep(y, .844, .874) * (1 - MathUtils.smoothstep(y, 1.09, 1.145))
        if (!blend) continue
        const across = MathUtils.clamp(.5 + side / .20, .015, .985)
        const down = y >= 1.04 ? MathUtils.mapLinear(y, 1.04, 1.11, eye, .02)
          : y >= .981 ? MathUtils.mapLinear(y, .981, 1.04, nostril, eye)
            : y >= .944 ? MathUtils.mapLinear(y, .944, .981, mouth, nostril)
              : MathUtils.mapLinear(y, .872, .944, .97, mouth)
        uv.setXYZ(i, (portrait % 5 + across) / 5,
          1 - (Math.floor(portrait / 5) + MathUtils.clamp(down, .015, .985)) / 2, blend)
        const lower = band(y, .922, .079) * front
        const tip = band(y, .994, .025) * band(side, 0, .039) * front
        positions.setXYZ(i, x - nose * tip, y - chin * band(y, .891, .037) * front, z + side * jaw * lower)
      }
    }
  })
}
