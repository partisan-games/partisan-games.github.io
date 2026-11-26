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

test('Nikoletina keeps the same cap when switching weapons and trouser colors', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'sovjetski-partizan-3d')
  const [defaultLook, machineGunner] = story.looks
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  await story.create(stage, 1, defaultLook.value)
  const [, view] = objects
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  const { skeleton, geometry: reshaped, material: recolored } = skin
  const gun = view.anim.twoHandedWeapon
  assert.ok(gun.parent)

  const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')
  const { loadedModel } = await import('/core3d/assets/models.js')
  const source = loadedModel(story.block.description.model).getObjectByProperty('isSkinnedMesh', true)
  const { geometry, material } = source
  geometry.computeBoundingBox()
  const capDrop = geometry.boundingBox.max.x - reshaped.boundingBox.max.x
  assert.ok(capDrop > 0 && capDrop < .02)
  assert.deepEqual(reshaped.attributes.skinWeight.array, geometry.attributes.skinWeight.array)
  assert.deepEqual(reshaped.attributes.skinIndex.array, geometry.attributes.skinIndex.array)
  assert.equal(recolored.map, material.map)
  const brownShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  recolored.onBeforeCompile(brownShader)
  assert.match(brownShader.vertexShader, /vNikoletinaHeight = position.x/)
  assert.match(brownShader.fragmentShader, /mix\(cloth, wool, leg \* fabric\)/)
  const brown = brownShader.uniforms.nikoletinaWool.value
  assert.ok(brown.x > brown.y && brown.y > brown.z)

  const runtime = makeCharacter(story.block.description)
  const runtimeSkin = runtime.model.mesh.getObjectByProperty('isSkinnedMesh', true)
  assert.deepEqual(runtimeSkin.geometry.attributes.position.array, reshaped.attributes.position.array)
  assert.equal(runtimeSkin.material.customProgramCacheKey(), recolored.customProgramCacheKey())

  stage.setLook(machineGunner.value)
  assert.equal(gun.parent, null)
  assert.deepEqual(skin.geometry.attributes.position.array, reshaped.attributes.position.array)
  const navyShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  skin.material.onBeforeCompile(navyShader)
  assert.equal(navyShader.fragmentShader, brownShader.fragmentShader)
  const navy = navyShader.uniforms.nikoletinaWool.value
  assert.ok(navy.z > navy.y && navy.y > navy.x)
  stage.setLook(defaultLook.value)
  assert.equal(view.anim.twoHandedWeapon, gun)
  assert.ok(gun.parent)
  assert.equal(skin.skeleton, skeleton)
  assert.equal(skin.geometry.boundingBox.max.x, reshaped.boundingBox.max.x)
  const restoredShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  skin.material.onBeforeCompile(restoredShader)
  assert.deepEqual(restoredShader.uniforms.nikoletinaWool.value, brown)
})

test('the 3D Chetnik uses the rifle animations and the reshaped cap follows the head', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'cetnik-strelac-3d')
  const objects = []
  const body = await story.create({ add: (...items) => objects.push(...items) })
  const [, view] = objects
  assert.equal(objects[0], body)
  assert.ok(view.anim.twoHandedWeapon?.parent)
  const skin = view.mesh.getObjectByProperty('name', 'Partisan')
  const source = await new FBXLoader().loadAsync('/assets/models/character/soldier/partisan-lowpoly.fbx')
  const original = source.getObjectByName('Partisan')
  assert.deepEqual(skin.skeleton.bones.map(bone => bone.name), original.skeleton.bones.map(bone => bone.name))
  const { position, skinIndex, skinWeight } = skin.geometry.attributes
  const felt = skin.material.findIndex(({ name }) => name === 'dark.felt.and.boots')
  const cloth = skin.geometry.groups.filter(({ materialIndex }) => materialIndex === felt)
  const point = index => new THREE.Vector3().fromBufferAttribute(position, index)
  for (const [height, across] of [[1.141, -.013], [1.170, -.006]]) {
    const ray = new THREE.Ray(new THREE.Vector3(-.35, height, across), new THREE.Vector3(1, 0, 0))
    const covered = cloth.some(({ start, count }) => {
      for (let i = start; i < start + count; i += 3) {
        const hit = ray.intersectTriangle(point(i), point(i + 1), point(i + 2), true, new THREE.Vector3())
        if (hit && hit.x < -.2) return true
      }
      return false
    })
    assert.ok(covered, 'felt closes the opening under the cockade')
  }
  const badge = skin.material.findIndex(({ name }) => name === 'cockade')
  assert.ok(badge >= 0)
  const vertex = skin.geometry.groups.find(group => group.materialIndex === badge).start
  const head = skin.skeleton.bones.findIndex(bone => bone.name === 'mixamorigHead')
  assert.ok([0, 1, 2, 3].some(i => skinIndex.getComponent(vertex, i) === head && skinWeight.getComponent(vertex, i) > .5))

  const { mixer, actions } = view.anim
  for (const [state, name] of Object.entries({ walk: 'Rifle Walk', run: 'Rifle Run', attack: 'Firing Rifle', death: 'Dying' })) {
    const action = actions[state]
    const clip = action.getClip()
    assert.equal(clip.name, name)
    action.reset().play()
    mixer.update(0)
    view.mesh.updateMatrixWorld(true)
    const before = skin.getVertexPosition(vertex, new THREE.Vector3())
    mixer.update(.64 * clip.duration)
    view.mesh.updateMatrixWorld(true)
    assert.ok(skin.getVertexPosition(vertex, new THREE.Vector3()).distanceTo(before) > .001, name)
    mixer.stopAllAction()
  }
})

test('the second Chetnik wears a fur cap and uses hair and beard textures on the original skin', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', name => Object.assign(new THREE.Texture(), { name }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'cetnik-subara-3d')
  const objects = []
  await story.create({ add: (...items) => objects.push(...items) })
  const [, view] = objects
  const head = view.mesh.getObjectByName('mixamorigHead')
  const hat = view.mesh.getObjectByName('Šubara')
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  assert.ok(skin.geometry.index.count < skin.geometry.attributes.position.count, 'the old cap is hidden')
  assert.ok(view.anim.twoHandedWeapon?.parent)
  assert.equal(hat.parent, head)
  assert.deepEqual(head.children.filter(child => child.isMesh), [hat])
  assert.equal(hat.children.filter(child => child.isMesh).length, 0)
  const hatShader = { ...THREE.ShaderLib.standard, uniforms: {} }
  hat.material.onBeforeCompile(hatShader)
  assert.match(hatShader.uniforms.chetnikCockade.value.name, /chetnik-cockade\.svg$/)
  assert.match(hatShader.fragmentShader, /if \(vCockadeFront > 0\.0 &&/)
  const shader = { ...THREE.ShaderLib.phong, uniforms: {} }
  skin.material.onBeforeCompile(shader)
  assert.match(shader.uniforms.chetnikFace.value.name, /chetnik-face\.svg$/)
  assert.match(shader.fragmentShader, /if \(onFace \|\| onNape\)/)
  assert.match(shader.fragmentShader, /mix\(sampledDiffuseColor\.rgb, hair\.rgb, hair\.a\)/)
  view.mesh.updateMatrixWorld(true)
  const before = hat.localToWorld(new THREE.Vector3(1, .05, 0))
  view.actions.death.reset().play()
  view.anim.mixer.update(view.actions.death.getClip().duration * .7)
  assert.ok(hat.localToWorld(new THREE.Vector3(1, .05, 0)).distanceTo(before) > .1)

  const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')
  const nikoletina = ww2.find(({ id }) => id === 'sovjetski-partizan-3d')
  const { model } = makeCharacter(nikoletina.block.description)
  assert.equal(model.mesh.getObjectByName('Šubara'), undefined)
  const nikoletinaSkin = model.mesh.getObjectByProperty('isSkinnedMesh', true)
  assert.equal(nikoletinaSkin.geometry.index, null)
  const nikoletinaShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  nikoletinaSkin.material.onBeforeCompile(nikoletinaShader)
  assert.equal(nikoletinaShader.uniforms.chetnikFace, undefined)
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
