import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import { wreckFor } from '/core/actor/wreckView.js'
import wreckArt from '/core/actor/wreckArt.js'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

test('the Renault and Hotchkiss use painted armor states and live tracks in the catalogue', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (name, onLoad) => {
    const texture = Object.assign(new THREE.Texture(), { name })
    if (onLoad) queueMicrotask(() => onLoad(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (_url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 512, height: 512 }))
    return {}
  })
  for (const Loader of [GLTFLoader, FBXLoader]) t.mock.method(Loader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return Loader === GLTFLoader ? new Loader().parseAsync(buffer, '') : new Loader().parse(buffer, '')
  })
  const { vehicles } = await import('/catalog/stories/characters3d.js')
  for (const story of vehicles) {
    const added = []
    const scene = new THREE.Scene()
    const stage = {
      controllers: [],
      add(...args) {
        added.push(...args)
        scene.add(args[1].mesh)
      },
    }
    const body = await story.create(stage)
    const [, view] = added
    t.after(() => view.end())
    const hotchkiss = story.id === 'hotchkiss-h35-3d'
    const part = view.mesh.getObjectByName(hotchkiss ? 'track-left' : 'GUN_FT17P_LP')
    const material = hotchkiss ? part.material : part.material[0]
    const track = hotchkiss ? part.material.map : part.material[1].map
    const shader = { ...THREE.ShaderLib.standard, uniforms: {} }
    material.onBeforeCompile(shader)
    assert.match(shader.fragmentShader, /texture2D\(armorWreck/)
    for (const key of ['armorHits', 'armorWreck'])
      assert.equal((await readFile('.' + shader.uniforms[key].value.name)).toString('ascii', 8, 16), 'WEBPVP8L')
    if (!hotchkiss) {
      assert.match(material.map.name, /renault-ft-base\.webp$/)
      const plates = shader.uniforms.armorPlates.value
      assert.match(plates.name, /renault-ft-plates\.webp$/)
      assert.equal(plates.magFilter, THREE.NearestFilter)
      assert.equal((await readFile('.' + plates.name)).toString('ascii', 8, 16), 'WEBPVP8L')
      const beltShader = { ...THREE.ShaderLib.standard, uniforms: {} }
      part.material[1].onBeforeCompile(beltShader)
      assert.equal(beltShader.uniforms.armorPlates, undefined)
      assert.notEqual(material.customProgramCacheKey(), part.material[1].customProgramCacheKey())
    } else assert.equal(shader.uniforms.armorPlates, undefined)
    const { armorCondition } = shader.uniforms
    assert.equal(armorCondition.value, 0)
    assert.ok(body.states.includes('wreck'))
    body.setState('move')
    stage.controllers[0].update()
    body.update(.07)
    view.update(.07, .07)
    assert.notEqual(track.offset.x, 0)
    body.takeHit(body.health.maximum * .1)
    view.update(0, .07)
    assert.equal(armorCondition.value, 1)
    assert.equal(view.wreckFlames, undefined)
    if (hotchkiss) {
      body.setState('wreck')
      view.update(0, .07)
      assert.equal(body.dead, true)
      assert.equal(body.state, 'wreck')
      assert.equal(armorCondition.value, 2)
      assert.equal(view.wreckFlames, undefined)
    }
    body.setState('dead')
    const position = track.offset.x
    const hullSide = part.geometry.attributes.position.array.slice()
    const turret = view.mesh.getObjectByName('turret')
    const turretRotation = turret?.quaternion.clone()
    body.update(1)
    view.update(1, 1.07)
    assert.equal(armorCondition.value, 2)
    assert.equal(track.offset.x, position)
    assert.equal(view.wreckMaterials, undefined)
    assert.equal(view.mesh.rotation.x, 0)
    assert.equal(view.mesh.rotation.z, 0)
    assert.ok(Math.abs(new THREE.Box3().setFromObject(view.mesh, true).min.y - body.feet) < 1e-6)
    const { fire: wreckFire, smoke: wreckSmoke } = view.wreckFlames
    assert.equal(wreckFire.mesh.parent, scene)
    assert.equal(wreckSmoke.mesh.parent, scene)
    assert.ok(wreckSmoke.mesh.position.y > wreckFire.mesh.position.y)
    const engine = view.mesh.worldToLocal(wreckFire.mesh.position.clone())
    assert.ok(engine.z > 0, 'flames come from the rear engine deck')
    const plume = wreckSmoke.mesh.geometry.attributes.position.array.slice()
    view.update(.1, 1.17)
    assert.equal(view.wreckFlames.smoke, wreckSmoke, 'the plume persists while the wreck is held')
    assert.notDeepEqual(wreckSmoke.mesh.geometry.attributes.position.array, plume)
    assert.deepEqual(part.geometry.attributes.position.array, hullSide)
    if (turret) assert.ok(turret.quaternion.equals(turretRotation))
    if (hotchkiss) assert.equal(view.flameKind.muzzle[2], -1.43)
    body.setState('wreck')
    view.update(.1, 1.27)
    assert.equal(body.state, 'wreck')
    assert.equal(armorCondition.value, 2)
    assert.equal(view.wreckFlames, undefined)
    assert.equal(wreckFire.mesh.parent, null)
    assert.equal(wreckSmoke.mesh.parent, null)
    body.setState('dead')
    view.update(.1, 1.37)
    assert.equal(view.wreckFlames.fire.mesh.parent, scene)
    view.end()
    assert.equal(wreckFire.mesh.parent, null)
    assert.equal(wreckSmoke.mesh.parent, null)
  }
})

test('the catalogue trucks roll on their axles, keep painted wrecks and use dark army truck glass', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (name, onLoad) => {
    const texture = Object.assign(new THREE.Texture(), { name })
    if (onLoad) queueMicrotask(() => onLoad(texture))
    return texture
  })
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { props } = await import('/catalog/stories/props3d.js')
  const { default: WarDebris } = await import('/core3d/actor/buildings/WarDebris.js')
  for (const [id, folder, front] of [['truck', 'opel-blitz', -1], ['army-truck', 'army-truck', 1]]) {
    const scene = new THREE.Scene()
    const story = props.find(({ id: key }) => key === 'rat-' + id)
    const truck = await story.create({ add: block => scene.add(block.mesh) })
    assert.deepEqual(truck.states, ['idle', 'move', 'dead', 'wreck'])
    const rotation = truck.mesh.quaternion.clone()
    const part = truck.mesh.getObjectByProperty('isMesh', true)
    const shader = { ...THREE.ShaderLib.phong, uniforms: {} }
    const material = Array.isArray(part.material) ? part.material[0] : part.material
    material.onBeforeCompile(shader)
    const { armorCondition, armorWreck } = shader.uniforms
    assert.ok(armorWreck.value.name.endsWith('/' + folder + '/wreck.webp'))
    assert.equal((await readFile('.' + armorWreck.value.name)).toString('ascii', 8, 16), 'WEBPVP8L')
    const windows = truck.mesh.getObjectByName('ArmyTruck_Window_ArmyTruck_Glass_0')
    if (id === 'army-truck') {
      assert.equal(windows.material.transparent, true)
      assert.ok(windows.material.opacity < 1)
      assert.notEqual(windows.material.color.getHex(), 0xffffff)
      assert.ok(truck.mesh.getObjectByName('Truck_ArmyTruck_main_0').material.map)
    }
    truck.update(.1, .1)
    assert.equal(armorCondition.value, 0)
    assert.equal(truck.wreckFlames, undefined)
    const wheels = []
    truck.mesh.traverse(wheel => {
      if (!(id === 'truck' ? /^Cube00[1237]$/ : /^Wheel_/).test(wheel.name)) return
      const box = new THREE.Box3().setFromObject(wheel, true)
      const center = box.getCenter(new THREE.Vector3())
      wheels.push({
        wheel, center, axle: wheel.worldToLocal(center.clone()), radius: (box.max.y - box.min.y) / 2,
        rest: wheel.getWorldQuaternion(new THREE.Quaternion()),
      })
    })
    assert.equal(wheels.length, id === 'truck' ? 4 : 6)
    truck.setState('move')
    truck.update(.2, .3)
    const distance = truck.mesh.position.z
    assert.equal(Math.sign(distance), front)
    for (const { wheel, center, axle, radius, rest } of wheels) {
      const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), distance / radius)
        .multiply(rest)
      assert.ok(wheel.getWorldQuaternion(new THREE.Quaternion()).angleTo(expected) < 1e-6, wheel.name)
      assert.ok(wheel.localToWorld(axle).distanceTo(center.clone().add(new THREE.Vector3(0, 0, distance))) < 1e-6, wheel.name)
    }
    truck.setState('idle')
    const stopped = wheels[0].wheel.quaternion.clone()
    truck.update(.2, .5)
    assert.equal(truck.mesh.position.z, distance)
    assert.ok(wheels[0].wheel.quaternion.equals(stopped))
    truck.setState('move')
    truck.setState('wreck')
    truck.setState('move')
    truck.update(.1, .6)
    assert.equal(truck.mesh.position.z, distance)
    assert.ok(wheels[0].wheel.quaternion.equals(stopped))
    assert.equal(armorCondition.value, 2)
    assert.ok(truck.mesh.quaternion.equals(rotation))
    if (windows) {
      assert.equal(windows.visible, false)
      assert.equal(new WarDebris(id).mesh.getObjectByName(windows.name).visible, true)
    }
    assert.equal(truck.state, 'wreck')
    assert.equal(truck.wreckFlames, undefined)
    truck.setState('dead')
    truck.update(.1, .7)
    const { fire, smoke } = truck.wreckFlames
    assert.equal(fire.mesh.parent, scene)
    assert.equal(smoke.mesh.parent, scene)
    assert.equal(Math.sign(fire.mesh.position.z), front)
    assert.ok(smoke.mesh.position.y > fire.mesh.position.y)
    truck.setState('wreck')
    assert.equal(armorCondition.value, 2)
    assert.equal(truck.wreckFlames, undefined)
    truck.end()
    assert.equal(fire.mesh.parent, null)
    assert.equal(smoke.mesh.parent, null)
  }
})

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

test('switching Koča variants keeps him in the same scene and pose', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const { findStory } = await import('/catalog/catalog.js')
  const story = ww2.find(({ id }) => id === 'partizan-3d')
  const original = story.looks.find(({ id }) => id === 'original')
  const basic = story.looks.find(({ id }) => id === 'strelac')
  const sutjeska = story.looks.find(({ id }) => id === 'sutjeska')
  const pixelArt = story.looks.find(({ id }) => id === 'pixel-art')
  const portrait1943 = story.looks.find(({ id }) => id === 'portret-1943')
  const kind = { id: 'drugi-svetski-rat-3d', stories: [story] }
  const address = `${kind.id}/${story.id}`
  assert.equal(findStory([kind], address).look, pixelArt)
  assert.equal(findStory([kind], `${address}/portret-1943`).look, portrait1943)
  assert.equal(findStory([kind], `${address}/sutjeska`).look, sutjeska)
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  const body = await story.create(stage, 1, findStory([kind], address).look.value)
  const [, view] = objects
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  assert.match(skin.material.find(({ name }) => name === '_1___Default').map.name, /\/sutjeska-pixel-art\/uniform\.webp$/)
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

  stage.setLook(pixelArt.value)
  assert.equal(skin.geometry, originalGeometry)
  assert.equal(view.anim.twoHandedWeapon, weapon)
  for (const [name, file] of [['_1___Default', 'uniform'], ['Tex_0534_0_dds', 'face'], ['Tex_0532_0_dds', 'eyes']]) {
    const { map } = skin.material.find(material => material.name === name)
    assert.ok(map.name.endsWith(`/sutjeska-pixel-art/${file}.webp`))
    assert.equal(map.magFilter, THREE.NearestFilter)
    assert.equal(map.minFilter, THREE.NearestMipmapLinearFilter)
    const bytes = await readFile('.' + map.name)
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  }

  const mapFor = name => skin.material.find(material => material.name === name).map
  const baseMaps = ['_1___Default', 'Tex_0532_0_dds', 'Tex_0534_0_dds'].map(mapFor)
  stage.setLook(portrait1943.value)
  assert.equal(skin.geometry, originalGeometry)
  assert.equal(mapFor('_1___Default'), baseMaps[0])
  const trialEyes = mapFor('Tex_0532_0_dds')
  assert.match(trialEyes.name, /\/sutjeska-pixel-art\/eyes-koca-1943\.webp$/)
  assert.equal((await readFile('.' + trialEyes.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  const portraitMap = mapFor('Tex_0534_0_dds')
  assert.match(portraitMap.name, /\/sutjeska-pixel-art\/face-koca-1943\.webp$/)
  assert.equal((await readFile('.' + portraitMap.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  stage.setLook(pixelArt.value)
  assert.equal(mapFor('Tex_0532_0_dds'), baseMaps[1])
  assert.equal(mapFor('Tex_0534_0_dds'), baseMaps[2])

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

test('Drug Crni uses his rifle model with the pixel-art maps in the existing UV slots', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')
  const { description } = await import('/core3d/actor/derived/ww2/ResistanceFighter.js')
  const story = ww2.find(({ id }) => id === 'radnik-3d')
  const look = story.looks.find(({ id }) => id === 'pixel-art')
  assert.equal(story.looks[0].id, 'puska')
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  const body = await story.create(stage, 1, look.value)
  const [, view] = objects
  const original = makeCharacter(description)
  const maps = []
  view.mesh.traverse(part => {
    if (!part.isSkinnedMesh) return
    const source = original.model.mesh.getObjectByName(part.name)
    assert.equal(part.geometry, source.geometry)
    assert.equal(part.skeleton.bones.length, source.skeleton.bones.length)
    if (part.material.map.name.includes('/crni-pixel-art/')) maps.push(part.material.map)
  })
  assert.equal(maps.length, 5)
  for (const map of maps) {
    assert.equal(map.magFilter, THREE.NearestFilter)
    assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 12), 'WEBP')
  }
  assert.deepEqual(body.size, original.body.size)
  assert.ok(view.actions.walk && view.actions.attack && view.anim.twoHandedWeapon.parent)
})

test('Brka switches his face and clothing maps on the same model with the Berthier rifle', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const brka = ww2.find(({ id }) => id === 'borac-pokreta-otpora-3d-s-brkovima')
  const original = brka.looks.find(({ id }) => id === 'brkovi')
  const pixelArt = brka.looks.find(({ id }) => id === 'pixel-art')
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  await brka.create(stage, 1, original.value)
  const [, view] = objects
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  const face = view.mesh.getObjectsByProperty('isSkinnedMesh', true).find(part => part.material.name === 'mat_12-27374460.jpg')
  const { geometry, skeleton, material } = face
  const { actions } = view
  stage.setLook(pixelArt.value)
  assert.notEqual(face.material, material)
  assert.ok(face.material.map.name.endsWith('/brka-pixel-art/face.webp'))
  assert.equal((await readFile('.' + face.material.map.name)).toString('ascii', 8, 12), 'WEBP')
  assert.equal(face.material.map.magFilter, THREE.NearestFilter)
  assert.equal(pixelArt.value.weapon, original.value.weapon)
  assert.equal(face.geometry, geometry)
  assert.equal(face.skeleton, skeleton)
  assert.equal(view.actions, actions)
  assert.ok(skin.parent)
  stage.setLook(original.value)
  assert.equal(face.material.map, material.map)
})

test('Sava opens in pixel art and can switch to his original materials on the same mesh', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const savo = ww2.find(({ id }) => id === 'partizan-jednostavan-model-3d')
  const [pixelArt] = savo.looks
  const original = savo.looks.find(look => look.id === 'original')
  const brown = savo.looks.find(look => look.id === 'smedji-pixel-art')
  const originalBrown = savo.looks.find(look => look.id === 'smedji')
  assert.equal(pixelArt.id, 'pixel-art')
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  await savo.create(stage, 1, original.value)
  const [, view] = objects
  const parts = view.mesh.getObjectsByProperty('isSkinnedMesh', true)
  assert.ok(parts.some(part => part.name === 'brkovi'))
  const before = parts.map(({ geometry, skeleton, material }) => ({ geometry, skeleton, material }))
  const { actions } = view
  const rifle = view.anim.twoHandedWeapon
  stage.setLook(pixelArt.value)
  const maps = new Set()
  for (const [i, part] of parts.entries()) {
    if (part.name === 'Partisan') {
      const originalGeometry = before[i].geometry
      assert.notEqual(part.geometry, originalGeometry)
      assert.equal(part.geometry.index.count, originalGeometry.index.count - (44 - 16) * 3)
      assert.deepEqual(part.geometry.attributes.skinWeight.array, originalGeometry.attributes.skinWeight.array)
      const cloth = part.material.findIndex(material => material.name === 'army.green')
      const group = part.geometry.groups.find(group => group.materialIndex === cloth)
      const panelStart = group.start + group.count - 16 * 3
      const { index, attributes: { position } } = part.geometry
      const attached = []
      for (let j = panelStart; j < group.start + group.count; j += 3) {
        const edge = index.getX(j)
        const point = new THREE.Vector3().fromBufferAttribute(position, edge)
        const other = new THREE.Vector3()
        const originalEdge = index.array.subarray(group.start, panelStart)
          .find(vertex => other.fromBufferAttribute(position, vertex).distanceTo(point) < .00001)
        assert.notEqual(originalEdge, undefined, 'each new edge meets the existing blouse')
        attached.push([edge, originalEdge])
      }
      view.anim.mixer.stopAllAction()
      actions.walk.play()
      view.anim.mixer.update(.25)
      view.mesh.updateMatrixWorld(true)
      for (const [edge, originalEdge] of attached) {
        const posed = vertex => part.applyBoneTransform(vertex, new THREE.Vector3().fromBufferAttribute(position, vertex))
        assert.ok(posed(edge).distanceTo(posed(originalEdge)) < .001, 'the join follows the skeleton during a step')
      }
    } else assert.equal(part.geometry, before[i].geometry)
    assert.equal(part.skeleton, before[i].skeleton)
    for (const material of [].concat(part.material)) {
      if (!material.map?.name.includes('/savo-pixel-art/')) continue
      assert.equal(material.color.getHex(), 0xffffff)
      assert.equal(material.map.magFilter, THREE.NearestFilter)
      maps.add(material.map.name)
    }
  }
  assert.deepEqual([...maps].map(path => path.split('/').pop()).sort(),
    ['face.webp', 'hair-and-leather.webp', 'trousers.webp', 'uniform.webp'])
  for (const path of maps) {
    const bytes = await readFile('.' + path)
    assert.equal(bytes.toString('ascii', 8, 16), 'WEBPVP8L')
  }
  assert.equal(view.actions, actions)
  assert.equal(view.anim.twoHandedWeapon, rifle)
  assert.ok(rifle.parent)
  const torso = parts.find(part => part.name === 'Partisan')
  const material = name => torso.material.find(item => item.name === name)
  const shared = ['skin', 'brown', 'navy.blue'].map(name => material(name).map)
  const olive = material('army.green').map
  const blouseIndices = torso.geometry.index.count
  stage.setLook(brown.value)
  assert.equal(brown.value.weapon, originalBrown.value.weapon)
  assert.equal(brown.value.weapon.model.file, 'weapon/rifle-berthier/model.fbx')
  assert.equal(torso.geometry.index.count, blouseIndices)
  assert.equal(material('avocado').color.getHex(), originalBrown.value.outfit.avocado)
  assert.deepEqual(['skin', 'brown', 'navy.blue'].map(name => material(name).map), shared)
  const brownUniform = material('army.green').map
  assert.match(brownUniform.name, /\/savo-pixel-art\/uniform-brown\.webp$/)
  assert.equal((await readFile('.' + brownUniform.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  assert.equal(material('army.green').color.getHex(), 0xffffff)
  stage.setLook(pixelArt.value)
  assert.equal(material('army.green').map, olive)
  assert.equal(view.anim.twoHandedWeapon, rifle)
  stage.setLook(original.value)
  for (const [i, part] of parts.entries()) {
    assert.equal(part.material, before[i].material)
    assert.equal(part.geometry, before[i].geometry)
  }
})

test('the heavy German infantry trial uses six pixel maps and the original MG animations', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'nemacki-mitraljezac-3d')
  assert.deepEqual(story.looks.map(({ id }) => id), ['pixel-art-drugo-lice', 'mitraljez', 'pixel-art', 'bacac-plamena'])
  const views = []
  const cleanups = []
  const stage = { add: (body, view) => views.push(view), session: { scope: { add: cleanup => cleanups.push(cleanup) } } }
  await story.create(stage, 1, story.looks[0].value)
  await story.create(stage, 1, story.looks[1].value)
  await story.create(stage, 1, story.looks[2].value)
  const [newPortrait, original, pixelArt] = views
  const skin = view => view.mesh.getObjectByProperty('isSkinnedMesh', true)
  assert.equal(skin(original).geometry, skin(pixelArt).geometry)
  assert.equal(skin(pixelArt).geometry.groups.length, 23)
  assert.equal(skin(newPortrait).geometry, skin(pixelArt).geometry)
  const textures = new Set(skin(pixelArt).material.map(({ map }) => map).filter(map => map?.name.includes('/german-heavy-pixel-art/')))
  assert.equal(textures.size, 6)
  const originalMaterials = skin(original).material
  for (const material of skin(pixelArt).material) {
    const base = originalMaterials.find(({ name }) => name === material.name)
    assert.equal(material.color.getHex(), base.color.getHex())
    if (textures.has(material.map)) {
      assert.equal(material.map.magFilter, THREE.NearestFilter)
      assert.equal(material.map.wrapT, base.map.wrapT)
    }
  }
  for (const map of textures)
    assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  const changed = skin(newPortrait).material.filter((material, i) => material.map.name !== skin(pixelArt).material[i].map.name)
  assert.deepEqual(changed.map(({ map }) => map.name.split('/').pop()),
    ['face-new-identity.webp', 'eyes-new-identity.webp'])
  for (const { map } of changed)
    assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  assert.equal(pixelArt.actions.walk.getClip().name, original.actions.walk.getClip().name)
  assert.equal(pixelArt.actions.attack.getClip().name, original.actions.attack.getClip().name)
  assert.ok(pixelArt.anim.twoHandedWeapon.parent)
  let disposed = 0
  for (const map of textures) map.addEventListener('dispose', () => disposed++)
  cleanups.forEach(cleanup => cleanup())
  assert.equal(disposed, 6)
})

test('the German rifleman switches texture on his existing animated catalogue model', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'nemacki-vojnik-3d')
  const [original, pixelArt] = story.looks
  assert.deepEqual([original.id, pixelArt.id], ['original', 'pixel-art'])
  const objects = []
  const cleanups = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add: cleanup => cleanups.push(cleanup) } } }
  await story.create(stage, 1, original.value)
  const [, view] = objects
  const skin = view.mesh.getObjectByProperty('isSkinnedMesh', true)
  const { geometry, skeleton, material } = skin
  const { actions } = view
  const rifle = view.anim.twoHandedWeapon
  stage.setLook(pixelArt.value)
  const dressed = skin.material
  assert.ok(dressed.map.name.endsWith('/german-soldier-pixel-art/uniform.webp'))
  assert.equal(dressed.map.magFilter, THREE.NearestFilter)
  assert.equal(dressed.map.minFilter, THREE.NearestMipmapLinearFilter)
  const bytes = await readFile('.' + dressed.map.name)
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  assert.equal(skin.geometry, geometry)
  assert.equal(skin.skeleton, skeleton)
  assert.equal(view.actions, actions)
  assert.equal(view.anim.twoHandedWeapon, rifle)
  stage.setLook(original.value)
  assert.equal(skin.material, material)
  stage.setLook(pixelArt.value)
  assert.equal(skin.material, dressed)
  for (const cleanup of cleanups) cleanup()
})

test('Nikoletina keeps the same cap when switching weapons and trouser colors', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'sovjetski-partizan-3d')
  const [pixelArt, yugoslav, machineGunner] = story.looks
  assert.equal(pixelArt.id, 'pixel-art', 'the default look')
  assert.equal(yugoslav.id, 'jugoslovenska')
  const objects = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add() {} } } }
  await story.create(stage, 1, yugoslav.value)
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

  view.actions.idle.time = .18
  stage.setLook(pixelArt.value)
  assert.equal(view.anim.twoHandedWeapon, gun)
  assert.equal(view.actions.idle.time, .18)
  assert.equal(skin.skeleton, skeleton)
  for (const key of ['position', 'normal', 'uv', 'skinWeight', 'skinIndex'])
    assert.deepEqual(skin.geometry.attributes[key].array, reshaped.attributes[key].array)
  const { map } = skin.material
  assert.equal(map.magFilter, THREE.NearestFilter)
  assert.equal(map.minFilter, THREE.NearestMipmapLinearFilter)
  assert.match(map.name, /\/nikoletina-pixel-art\.webp$/)
  assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 12), 'WEBP')

  stage.setLook(yugoslav.value)
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
  t.mock.method(THREE.TextureLoader.prototype, 'load', name => Object.assign(new THREE.Texture(), { name }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const story = ww2.find(({ id }) => id === 'cetnik-strelac-3d')
  const objects = []
  const cleanups = []
  const stage = { add: (...items) => objects.push(...items), session: { scope: { add: cleanup => cleanups.push(cleanup) } } }
  const body = await story.create(stage)
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
  const [base, pixel] = story.looks
  assert.deepEqual([base.id, pixel.id], ['original', 'pixel-art'])
  const originalMaterials = skin.material
  const { geometry, skeleton } = skin
  const rifle = view.anim.twoHandedWeapon
  stage.setLook(pixel.value)
  const textures = skin.material.filter(material => material.map).map(material => material.map)
  assert.deepEqual(textures.map(map => map.name.split('/').pop()).sort(),
    ['blouse.webp', 'face.webp', 'hair-beard.webp', 'lips.webp', 'trousers.webp'])
  for (const map of textures)
    assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  assert.equal(skin.material[badge], originalMaterials[badge])
  assert.equal(skin.material[felt], originalMaterials[felt])
  assert.equal(skin.geometry, geometry)
  assert.equal(skin.skeleton, skeleton)
  assert.equal(view.anim.twoHandedWeapon, rifle)
  stage.setLook(base.value)
  assert.equal(skin.material, originalMaterials)
  cleanups.forEach(cleanup => cleanup())
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
  const cleanups = []
  const stage = {
    add: (...items) => objects.push(...items),
    session: { scope: { add: cleanup => cleanups.push(cleanup) } },
  }
  assert.deepEqual(story.looks.map(({ id }) => id), ['original', 'pixel-art'])
  await story.create(stage, undefined, story.looks[0].value)
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
  const badge = hatShader.uniforms.chetnikCockade.value
  assert.match(badge.name, /chetnik-cockade-m72\.webp$/)
  assert.equal(badge.magFilter, THREE.NearestFilter)
  assert.equal((await readFile('.' + badge.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  assert.match(hatShader.fragmentShader, /if \(vCockadeFront > 0\.0 &&/)
  const shader = { ...THREE.ShaderLib.phong, uniforms: {} }
  skin.material.onBeforeCompile(shader)
  assert.match(shader.uniforms.chetnikFace.value.name, /chetnik-face\.svg$/)
  assert.match(shader.fragmentShader, /if \(onFace \|\| onNape\)/)
  assert.match(shader.fragmentShader, /mix\(sampledDiffuseColor\.rgb, hair\.rgb, hair\.a\)/)
  const original = skin.material
  const { geometry, skeleton } = skin
  stage.setLook(story.looks[1].value)
  const pixel = skin.material
  assert.notEqual(pixel, original)
  assert.equal(skin.geometry, geometry)
  assert.equal(skin.skeleton, skeleton)
  assert.deepEqual(head.children.filter(child => child.isMesh), [hat])
  assert.match(pixel.map.name, /cetnik-subara-pixel-art\.webp$/)
  assert.equal(pixel.map.magFilter, THREE.NearestFilter)
  assert.equal((await readFile('.' + pixel.map.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  const pixelShader = { ...THREE.ShaderLib.phong, uniforms: {} }
  pixel.onBeforeCompile(pixelShader)
  assert.deepEqual(pixelShader.uniforms.nikoletinaWool, shader.uniforms.nikoletinaWool)
  assert.equal(pixelShader.uniforms.chetnikFace, undefined)
  stage.setLook(story.looks[0].value)
  assert.equal(skin.material, original)
  assert.equal(cleanups.length, 1)
  const dispose = t.mock.method(pixel.map, 'dispose')
  const disposeMaterial = t.mock.method(pixel, 'dispose')
  cleanups[0]()
  assert.equal(dispose.mock.callCount(), 1)
  assert.equal(disposeMaterial.mock.callCount(), 1)
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
