import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import { wreckFor } from '/core/actor/wreckView.js'
import wreckArt from '/core/actor/wreckArt.js'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

test('Sutjeska dresses the existing catalogue mesh and keeps the original animation skeleton', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  const { default: dressSutjeska } = await import('/core3d/actor/derived/ww2/sutjeskaLook.js')
  const load = async name => {
    const bytes = await readFile(`assets/models/character/soldier/${name}.fbx`)
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  }
  const original = await load('partisan')
  const candidate = clone(original)
  const source = original.getObjectByProperty('isSkinnedMesh', true)
  const dressed = candidate.getObjectByProperty('isSkinnedMesh', true)
  const rig = dressed.skeleton
  assert.equal(dressed.geometry, source.geometry)
  dressSutjeska(candidate)
  assert.notEqual(dressed.geometry, source.geometry)
  assert.notEqual(dressed.material, source.material)
  assert.notDeepEqual(dressed.geometry.attributes.position.array, source.geometry.attributes.position.array)
  assert.deepEqual(dressed.geometry.attributes.skinWeight.array, source.geometry.attributes.skinWeight.array)
  assert.deepEqual(dressed.geometry.attributes.skinIndex.array, source.geometry.attributes.skinIndex.array)
  assert.equal(dressed.geometry.attributes.position.count, source.geometry.attributes.position.count)
  assert.equal(dressed.skeleton, rig)
  assert.equal(dressed.children.length, source.children.length)
  const material = dressed.material.find(({ name }) => name === '_1___Default')
  const originalMaterial = source.material.find(({ name }) => name === material.name)
  const shader = { ...THREE.ShaderLib.phong, uniforms: {} }
  const originalShader = { ...shader }
  material.onBeforeCompile(shader)
  originalMaterial.onBeforeCompile(originalShader)
  assert.match(shader.uniforms.sutjeskaTrousers.value.name, /\/partisan-wool-uniform\.webp$/)
  assert.match(shader.fragmentShader, /if \(trousers\) sampledDiffuseColor\.rgb = wool/)
  assert.match(shader.fragmentShader, /diffuseColor\.rgb = mix\(diffuseColor\.rgb, red, opacity\)/)
  assert.doesNotMatch(originalShader.fragmentShader, /vUniformPosition/)
  const eyeShader = { ...THREE.ShaderLib.phong }
  dressed.material.find(({ name }) => name === 'Tex_0532_0_dds').onBeforeCompile(eyeShader)
  assert.match(eyeShader.fragmentShader, /float iris = smoothstep/)
  assert.match(eyeShader.fragmentShader, /vec3 brown =/)
  const hairShader = { ...THREE.ShaderLib.phong }
  dressed.material.find(({ name }) => name === 'Tex_0534_0_dds').onBeforeCompile(hairShader)
  assert.match(hairShader.fragmentShader, /mix\(hairColor, skin, trim\)/)
  const { position, color } = dressed.geometry.attributes
  const originalPosition = source.geometry.attributes.position
  let faceVertex
  let noseReceded = false
  for (let i = 0; i < position.count; i++) {
    const y = originalPosition.getY(i)
    const changed = position.getX(i) !== originalPosition.getX(i) || position.getY(i) !== y ||
      position.getZ(i) !== originalPosition.getZ(i)
    if (changed) {
      assert.ok(y > 2.205 && y < 2.38)
      faceVertex = i
    }
    if (y < 2.205) assert.deepEqual([color.getX(i), color.getY(i), color.getZ(i)], [1, 1, 1])
    if (y > 2.270 && y < 2.311 && Math.abs(originalPosition.getX(i)) < .022 && originalPosition.getZ(i) > .17) {
      assert.ok(position.getZ(i) <= originalPosition.getZ(i))
      if (originalPosition.getZ(i) - position.getZ(i) > .006) noseReceded = true
    }
  }
  assert.notEqual(faceVertex, undefined)
  assert.ok(noseReceded)

  for (const name of ['Rifle Idle', 'Rifle Walk', 'Firing Rifle', 'Dying']) {
    const [clip] = (await load(name)).animations
    const mixer = new THREE.AnimationMixer(candidate)
    mixer.clipAction(clip).play()
    mixer.update(0)
    candidate.updateMatrixWorld(true)
    const before = dressed.getVertexPosition(faceVertex, new THREE.Vector3())
    mixer.update(clip.duration * .75)
    candidate.updateMatrixWorld(true)
    const after = dressed.getVertexPosition(faceVertex, new THREE.Vector3())
    assert.ok(before.distanceTo(after) > .001, name)
    mixer.stopAllAction()
  }
})

test('switching to Sutjeska and back keeps Borac sa Sutjeske in the same scene and pose', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'partizan-3d')
  const original = story.looks.find(({ id }) => id === 'original')
  const basic = story.looks.find(({ id }) => id === 'strelac')
  const sutjeska = story.looks.find(({ id }) => id === 'sutjeska')
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  const body = await story.create(stage, 1, original.value)
  const [, view] = objects
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  const originalGeometry = skin.geometry
  const weapon = view.anim.twoHandedWeapon
  view.mesh.position.set(2, 0, 1)
  view.actions.idle.time = .18
  const before = [...objects]

  stage.setLook(sutjeska.value)
  assert.notEqual(skin.geometry, originalGeometry)
  assert.equal(view.anim.twoHandedWeapon, weapon)
  const uniform = () => skin.material.find(({ name }) => name === '_1___Default')
  const shader = { ...THREE.ShaderLib.phong, uniforms: {} }
  uniform().onBeforeCompile(shader)
  stage.setLook(basic.value)
  assert.equal(uniform().map, shader.uniforms.sutjeskaTrousers.value)
  const basicShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  uniform().onBeforeCompile(basicShader)
  assert.match(basicShader.fragmentShader, /diffuseColor\.rgb = mix\(diffuseColor\.rgb, red, opacity\)/)
  assert.doesNotMatch(basicShader.fragmentShader, /sutjeskaTrousers/)
  assert.equal(basicShader.uniforms.partisanBadgeRadius.value, .034)
  assert.equal(shader.uniforms.partisanBadgeRadius.value, .039)
  stage.setLook(original.value)
  assert.equal(skin.geometry, originalGeometry)
  assert.equal(objects[0], body)
  assert.deepEqual(objects, before)
  assert.deepEqual(view.mesh.position.toArray(), [2, 0, 1])
  assert.equal(view.actions.idle.time, .18)
  const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')
  const runtime = makeCharacter(story.block.description)
  const runtimeSkin = runtime.model.mesh.getObjectByProperty('isSkinnedMesh', true)
  const runtimeClothes = runtimeSkin.material.find(({ name }) => name === '_1___Default')
  assert.notEqual(runtimeSkin.geometry, originalGeometry)
  assert.ok(runtimeClothes.uniforms.sutjeskaTrousers.value.isTexture)
  assert.deepEqual(runtime.body.size, body.size)
})

test('a picture finds its wreck from its full address as from its path, and they share it', t => {
  loadImages(t)
  let checked = 0
  for (const [source, descriptor] of Object.entries(wreckArt)) {
    const wreck = wreckFor('/assets/images/' + source)
    assert.ok(wreck)
    assert.equal(wreck, wreckFor(source))
    assert.equal(wreck.src, '/assets/images/' + descriptor.src)
    checked++
  }
  assert.ok(checked > 10)
})

test('other catalog FBX models keep every triangle, material, vertex attribute and skeleton after regrouping', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const candidates = [
    ['weapon/mg-42/model.fbx', 68, 11],
    ['weapon/rifle.fbx', 5, 2],
  ]
  const faces = geometry => geometry.groups.flatMap(group => {
    const result = []
    for (let i = group.start; i < group.start + group.count; i += 3)
      result.push([group.materialIndex, ...[0, 1, 2].map(n => geometry.index ? geometry.index.getX(i + n) : i + n)].join(':'))
    return result
  }).sort()
  for (const [file, before, after] of candidates) {
    const bytes = await readFile('assets/models/' + file)
    const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    const meshes = []
    model.traverse(part => {
      if (part.isMesh) meshes.push(part)
    })
    const original = meshes.map(mesh => ({ geometry: mesh.geometry, groups: structuredClone(mesh.geometry.groups),
      faces: faces(mesh.geometry), material: mesh.material, skeleton: mesh.skeleton }))
    const groups = () => meshes.reduce((sum, mesh) => sum + Math.max(1, mesh.geometry.groups.length), 0)
    assert.equal(groups(), before, file)
    optimizeGeometry(model)
    assert.equal(groups(), after, file)
    meshes.forEach((mesh, i) => {
      const source = original[i]
      assert.equal(mesh.skeleton, source.skeleton)
      assert.equal(mesh.material, source.material)
      assert.deepEqual(faces(mesh.geometry), source.faces, file)
      assert.deepEqual(source.geometry.groups, source.groups, 'source geometry remains reusable')
      for (const [name, attribute] of Object.entries(source.geometry.attributes))
        assert.deepEqual(mesh.geometry.attributes[name].array, attribute.array, file + ': ' + name)
    })
  }
})
