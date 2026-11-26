import { MathUtils, ShaderChunk, Vector3 } from 'three'

const { smoothstep, clamp } = MathUtils
const brownWool = new Vector3(.168, .102, .052)
const navyWool = new Vector3(.040, .078, .138)

function recolorUniform(material, woolColor) {
  material.onBeforeCompile = shader => {
    shader.uniforms.nikoletinaWool = { value: woolColor }
    shader.vertexShader = 'varying float vNikoletinaHeight;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvNikoletinaHeight = position.x;')
    shader.fragmentShader = 'uniform vec3 nikoletinaWool;\nvarying float vNikoletinaHeight;\n' + shader.fragmentShader.replace('#include <map_fragment>',
      ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', /* glsl */ `
        vec2 atlas = vec2(vMapUv.x, 1.0 - vMapUv.y);
        vec3 cloth = sampledDiffuseColor.rgb;
        float tone = dot(cloth, vec3(0.2126, 0.7152, 0.0722));

        // Both red shoulder strips are painted on the front of the tunic in the same atlas.
        bool shoulder = atlas.x > 0.246 && atlas.x < 0.281 &&
          ((atlas.y > 0.785 && atlas.y < 0.837) || (atlas.y > 0.907 && atlas.y < 0.956));
        float piping = smoothstep(0.025, 0.085, cloth.r - cloth.g);
        if (shoulder) {
          vec3 olive = texture2D(map, vMapUv - vec2(0.015, 0.0)).rgb;
          cloth = mix(cloth, olive, piping);
        }

        // Rest-space height keeps the trouser color with the legs during animation.
        float leg = smoothstep(-0.91, -0.79, vNikoletinaHeight) * (1.0 - smoothstep(-0.12, -0.045, vNikoletinaHeight));
        float fabric = smoothstep(0.012, 0.031, tone) * smoothstep(-0.020, -0.001, cloth.g - cloth.r);
        vec3 wool = nikoletinaWool * clamp(tone * 11.0, 0.38, 1.28);
        sampledDiffuseColor.rgb = mix(cloth, wool, leg * fabric);
        diffuseColor *= sampledDiffuseColor;
      `))
  }
}

/** Recut Nikoletina's cap. The badge stays on its original UV island. */
function dress(figure, woolColor) {
  const skin = figure.getObjectByProperty('isSkinnedMesh', true)
  const geometry = skin.geometry.clone()
  const { position, uv } = geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const height = position.getX(i)
    const u = uv.getX(i), down = 1 - uv.getY(i)
    if (height < 1.062 || u < .357 || u > .491 || down < .850 || down > .987) continue
    const crown = clamp((height - 1.064) / .186, 0, 1)
    // Bring in the folded sides while keeping most of the height and volume above the head.
    const taper = .13 * smoothstep(crown, .02, .40) + .045 * smoothstep(crown, .43, 1)
    position.setX(i, height - .012 * smoothstep(crown, 0, 1))
    position.setZ(i, position.getZ(i) * (1 - taper))
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  skin.geometry = geometry
  skin.material = skin.material.clone()
  recolorUniform(skin.material, woolColor)
}

export default function dressNikoletina(figure) {
  dress(figure, brownWool)
}

export function dressNikoletinaNavy(figure) {
  dress(figure, navyWool)
}
