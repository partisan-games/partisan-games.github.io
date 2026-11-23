/** Original exterior-only game prop, in metres; run with node from any directory. */
import { register } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const project = new URL('../../../../', import.meta.url)
const three = new URL('libs/three/', project).href
const resolver = `export function resolve(id, context, next) {
  if (id === 'three') id = ${JSON.stringify(three)} + 'build/three.module.min.js';
  else if (id.startsWith('three/')) id = ${JSON.stringify(three)} + id.slice(6);
  return next(id, context);
}`
register(new URL(`data:text/javascript,${encodeURIComponent(resolver)}`), import.meta.url)
const THREE = await import('three')
const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js')

// The binary exporter needs Blob reading, but no DOM, images or raster textures.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result
      this.onloadend?.()
    })
  }
}

const gunBytes = await readFile(new URL('../cannon/field-gun-75.glb', import.meta.url))
const gun = JSON.parse(gunBytes.subarray(20, 20 + gunBytes.readUInt32LE(12)).toString())
const palette = new Map(gun.materials.map(material => [material.name, material.pbrMetallicRoughness]))
function material(name, reference) {
  const pbr = palette.get(reference)
  if (!pbr) throw new Error(`Missing field-gun style reference: ${reference}`)
  return new THREE.MeshStandardMaterial({ name, color: new THREE.Color().setRGB(...pbr.baseColorFactor.slice(0, 3)),
    metalness: pbr.metallicFactor, roughness: pbr.roughnessFactor, vertexColors: true })
}
const paint = material('Olive paint', 'Field olive')
const shade = material('Dark olive paint', 'Deep olive')
const edge = material('Raised painted edges', 'Faded olive')
const iron = material('Dark iron', 'Forged iron')
const worn = material('Rubbed steel', 'Worn steel')
const dark = material('Muzzle shadow', 'Bore shadow')

function mesh(parent, name, geometry, surface = paint) {
  geometry.normalizeNormals()
  // Quiet vertex variation avoids a flat plastic finish without borrowed textures.
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const grain = Math.sin(position.getX(i) * 73 + position.getY(i) * 41 + position.getZ(i) * 59)
    const value = .97 + grain * .045
    colors.set([value, value, value * .99], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const object = new THREE.Mesh(geometry, surface)
  object.name = name
  parent.add(object)
  return object
}
function group(parent, name) {
  const object = new THREE.Group()
  object.name = name
  parent.add(object)
  return object
}
function bar(parent, name, from, to, radius, surface = paint, endRadius = radius) {
  const start = new THREE.Vector3(...from), finish = new THREE.Vector3(...to)
  const direction = finish.clone().sub(start)
  const object = mesh(parent, name, new THREE.CylinderGeometry(endRadius, radius, direction.length(), 12), surface)
  object.position.copy(start).add(finish).multiplyScalar(.5)
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return object
}
function box(parent, name, size, position, surface = paint) {
  const object = mesh(parent, name, new THREE.BoxGeometry(...size), surface)
  object.position.set(...position)
  return object
}
function ring(parent, name, radius, thickness, position, surface = paint) {
  const object = mesh(parent, name, new THREE.TorusGeometry(radius, thickness, 5, 20), surface)
  object.position.set(...position)
  return object
}

const mortar = new THREE.Group()
mortar.name = 'Mortar81Mod35'
mortar.userData = { units: 'metres', forward: '+Z', purpose: 'Exterior game prop', license: 'MIT' }

const base = group(mortar, 'BasePlate')
const outline = new THREE.Shape()
outline.moveTo(-.23, -.22)
outline.lineTo(.23, -.22)
outline.quadraticCurveTo(.28, -.22, .28, -.17)
outline.lineTo(.28, .17)
outline.quadraticCurveTo(.28, .22, .23, .22)
outline.lineTo(-.23, .22)
outline.quadraticCurveTo(-.28, .22, -.28, .17)
outline.lineTo(-.28, -.17)
outline.quadraticCurveTo(-.28, -.22, -.23, -.22)
const plate = mesh(base, 'PressedPlate', new THREE.ExtrudeGeometry(outline, {
  depth: .025, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .008, bevelThickness: .008, curveSegments: 3,
}), shade)
plate.rotation.x = -Math.PI / 2
plate.position.set(0, .014, -.27)
for (const side of [-1, 1]) {
  box(base, `Rim${side}`, [.018, .025, .34], [side * .25, .052, -.27], edge)
  for (const end of [-1, 1])
    bar(base, `PressedRib${side}_${end}`, [side * .06, .052, -.27], [side * .21, .052, -.27 + end * .14], .012, paint)
  bar(base, `HandleArm${side}`, [side * .10, .05, -.47], [side * .10, .07, -.54], .008, iron)
}
bar(base, 'CarryHandle', [-.1, .07, -.54], [.1, .07, -.54], .009, iron)
const socket = mesh(base, 'ExteriorSocket', new THREE.SphereGeometry(.07, 12, 8), iron)
socket.position.set(0, .075, -.27)

const tube = group(mortar, 'Tube')
tube.position.set(0, .10, -.27)
const direction = new THREE.Vector3(0, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6))
tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
const tubeLength = 1.15
bar(tube, 'Barrel', [0, .025, 0], [0, tubeLength, 0], .052, paint, .047)
bar(tube, 'LowerCollar', [0, .04, 0], [0, .12, 0], .059, shade)
bar(tube, 'UpperCollar', [0, tubeLength - .028, 0], [0, tubeLength, 0], .053, edge)
// A flat dark face suggests the opening; there is no internal weapon mechanism.
const mouth = mesh(tube, 'MouthFace', new THREE.CircleGeometry(.039, 20), dark)
mouth.rotation.x = -Math.PI / 2
mouth.position.y = tubeLength + .0005
const muzzle = group(tube, 'Muzzle')
muzzle.position.set(0, tubeLength + .002, 0)
muzzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))
bar(tube, 'ClampingBand', [0, .67, 0], [0, .72, 0], .064, shade)
box(tube, 'ClampLug', [.15, .045, .07], [0, .69, -.015], iron)

const bipod = group(mortar, 'Bipod')
for (const side of [-1, 1]) {
  const foot = [side * .38, .018, .40]
  bar(bipod, `Leg${side}`, foot, [side * .055, .68, .14], .018, paint, .026)
  bar(bipod, `LegCuff${side}`, [side * .28, .20, .33], [side * .25, .265, .305], .025, shade)
  const shoe = mesh(bipod, `Foot${side}`, new THREE.CylinderGeometry(.047, .053, .018, 12), shade)
  shoe.position.set(...foot)
  box(bipod, `FootWear${side}`, [.035, .005, .045], [foot[0], .030, foot[2]], worn)
}
bar(bipod, 'Crosshead', [-.11, .68, .14], [.11, .68, .14], .029, iron)
bar(bipod, 'ElevationStem', [0, .48, .14], [0, .75, .14], .019, worn)
bar(bipod, 'ElevationSleeve', [0, .49, .14], [0, .61, .14], .033, shade)
bar(bipod, 'Cradle', [0, .71, .14], [0, .70, .076], .035, paint)
bar(bipod, 'HandwheelAxle', [-.17, .59, .14], [0, .59, .14], .012, iron)
const wheel = ring(bipod, 'Handwheel', .062, .008, [-.17, .59, .14], edge)
wheel.rotation.y = Math.PI / 2
for (let i = 0; i < 3; i++) {
  const angle = i * Math.PI * 2 / 3
  bar(bipod, `WheelSpoke${i}`, [-.17, .59, .14], [-.17, .59 + Math.cos(angle) * .057, .14 + Math.sin(angle) * .057], .005, iron)
}
bar(bipod, 'CrankGrip', [-.17, .65, .14], [-.22, .65, .14], .010, iron)
for (let i = 0; i < 15; i++) {
  const fraction = i / 14
  const link = ring(bipod, `ChainLink${i}`, .018, .003, [-.34 + fraction * .68, .055 + .045 * (2 * fraction - 1) ** 2, .40], iron)
  link.scale.x = 1.5
  if (i % 2) link.rotation.x = Math.PI / 2
}
box(bipod, 'SightBracket', [.025, .095, .024], [-.12, .76, .12], shade)
bar(bipod, 'SightBody', [-.12, .80, .08], [-.12, .80, .18], .018, iron)

const round = new THREE.Group()
round.name = 'MortarRound'
const profile = [[.016, 0], [.020, .025], [.020, .10], [.034, .15], [.040, .21], [.035, .255], [.020, .29], [.006, .315]]
mesh(round, 'RoundBody', new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 16), shade)
for (let i = 0; i < 6; i++) {
  const fin = box(round, `Fin${i}`, [.004, .085, .07], [0, .043, 0], iron)
  fin.rotation.y = i * Math.PI / 3
}
bar(round, 'NoseColor', [0, .30, 0], [0, .32, 0], .012, worn, .006)

function statistics(root) {
  root.updateMatrixWorld(true)
  let triangles = 0, meshes = 0
  root.traverse(object => {
    if (!object.isMesh) return
    meshes++
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3
  })
  const box = new THREE.Box3().setFromObject(root)
  return { meshes, triangles, bounds: { min: box.min.toArray(), max: box.max.toArray() } }
}
const exporter = new GLTFExporter()
// Keep the useful attachment groups, but batch their static details by material.
for (const part of [base, tube, bipod, round]) {
  const surfaces = new Map()
  for (const object of [...part.children]) {
    if (!object.isMesh) continue
    object.updateMatrix()
    const geometry = object.geometry.clone().applyMatrix4(object.matrix)
    if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i))
    if (!surfaces.has(object.material)) surfaces.set(object.material, [])
    surfaces.get(object.material).push(geometry)
    part.remove(object)
  }
  for (const [surface, geometries] of surfaces) {
    const object = new THREE.Mesh(mergeGeometries(geometries), surface)
    object.name = `${part.name}_${surface.name.replaceAll(' ', '')}`
    part.add(object)
  }
}
mortar.position.y = -new THREE.Box3().setFromObject(mortar).min.y
const outputs = []
for (const [file, object] of [['model.glb', mortar], ['round.glb', round]]) {
  const data = Buffer.from(await exporter.parseAsync(object, { binary: true, onlyVisible: true }))
  await writeFile(new URL(file, import.meta.url), data)
  outputs.push({ file, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), ...statistics(object) })
}
const source = {
  name: 'Italian 81 mm mortar — original game interpretation', license: 'MIT', units: 'metres',
  author: 'Partisan Games contributors',
  origin: 'Original parametric exterior meshes and vertex colors. No geometry, UV maps or images copied from the downloaded model.',
  limitations: 'Visual interpretation of the Mod. 35 family, not a measured museum reconstruction. Fixed deployed pose; no crew or firing logic.',
  axes: { up: '+Y', forward: '+Z', ground: 'y=0', muzzle: 'Tube/Muzzle, local +Z follows the tube' },
  styleReference: '../cannon/field-gun-75.glb',
  references: [
    { url: 'https://www.awm.gov.au/collection/C1007862', use: 'Museum identification and olive-painted exterior barrel.' },
    { url: 'https://www.awm.gov.au/collection/C149913', use: 'Museum rectangular baseplate and carrying handle.' },
  ],
  assets: outputs,
}
await writeFile(new URL('source.json', import.meta.url), JSON.stringify(source, null, 2) + '\n')
for (const output of outputs) console.log(`${output.file}: ${output.triangles} triangles, ${output.bytes} bytes`)
