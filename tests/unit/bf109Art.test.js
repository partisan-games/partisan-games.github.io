import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { models, description } from '/core3d/aircraft/derived/Messerschmitt.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import makeInterceptor from '/core3d/actor/aircraft/makeInterceptor.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import WarplaneModel from '/core3d/actor/aircraft/WarplaneModel.js'
import Warplane from '/core/gameplay/bodies/aircraft/Warplane.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'

test('the replacement Bf 109 embeds its textures, points forward and rotates its own propeller independently in both factories', async t => {
  createPageElements()
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1024, height: 1024 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
    assert.ok(document.images.every(image => image.bufferView !== undefined && !image.uri))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const mesh = loadedModel(description.model)
  let triangles = 0
  mesh.traverse(part => {
    if (!part.isMesh) return
    triangles += (part.geometry.index?.count ?? part.geometry.attributes.position.count) / 3
    assert.ok(part.geometry.attributes.uv)
    assert.ok(part.material.map)
  })
  assert.equal(triangles, 1981)
  const box = new THREE.Box3().setFromObject(mesh)
  assert.ok(Math.abs(box.getSize(new THREE.Vector3()).x - 9.92) < .001)
  const propeller = mesh.getObjectByName('Propeller')
  const shaft = propeller.getWorldPosition(new THREE.Vector3())
  assert.ok(shaft.z < box.min.z + 1, 'shaft is at the nose facing -Z')
  const clock = new GameClock()
  const target = new Warplane({ clock })
  const fighter = makeInterceptor(description, { clock, target })
  const catalog = makeWarplane(description, { clock })
  assert.notEqual(fighter.model.propellers[0], catalog.model.propellers[0])
  const before = fighter.model.propellers[0].rotation.z
  fighter.model.update(.01, .01)
  assert.notEqual(fighter.model.propellers[0].rotation.z, before)
  assert.equal(catalog.model.propellers[0].rotation.z, before)
  assert.ok(Math.abs(propeller.rotation.z - before) < 1e-10, 'prepared cache does not rotate with an instance')
  catalog.model.update(.01, .01)
  assert.notEqual(catalog.model.propellers[0].rotation.z, before)
  fighter.body.yaw = 0
  fighter.body.pitch = 0
  fighter.model.update(0, .01)
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(fighter.model.mesh.rotation)
  assert.ok(forward.x > .99, 'the nose matches the body heading at yaw zero')
  const bank = fighter.body.roll = .3
  fighter.model.update(0, .01)
  assert.equal(fighter.model.mesh.rotation.z, bank)
  fighter.body.setState('dead')
  fighter.body.update(.1)
  fighter.model.update(.1, .1)
  assert.ok(Number.isFinite(fighter.model.mesh.position.y))
  // Existing aircraft still attach their separately loaded generic propeller as before.
  const external = new THREE.Group()
  const oldStyle = new WarplaneModel(target, { mesh: new THREE.Group(), propeller: external })
  assert.equal(oldStyle.propellers[0].parent, oldStyle.mesh)
  const externalBefore = oldStyle.propellers[0].rotation.z
  oldStyle.update(.01, .01)
  assert.notEqual(oldStyle.propellers[0].rotation.z, externalBefore)
  for (const model of [fighter.model, catalog.model, oldStyle]) model.end()
})

test('the bombers and the Spitfire turn each of their propellers about its own shaft', async t => {
  createPageElements()
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 4, height: 4 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  // the middle of its blades, which stays on the shaft as they turn
  const middle = propeller => {
    const sum = new THREE.Vector3(), point = new THREE.Vector3()
    let count = 0
    propeller.traverse(part => {
      if (!part.isMesh) return
      for (const i of part.geometry.index.array) {
        sum.add(point.fromBufferAttribute(part.geometry.attributes.position, i).applyMatrix4(part.matrixWorld))
        count++
      }
    })
    return sum.divideScalar(count)
  }
  for (const [name, count] of [['Liberator', 4], ['FlyingFortress', 4], ['Mitchell', 2], ['Bomber', 4], ['Spitfire', 1]]) {
    const plane = await import(`/core3d/aircraft/derived/${name}.js`)
    await requestModels(plane.models)
    const { model } = makeWarplane(plane.description, { clock: new GameClock() })
    assert.equal(model.propellers.length, count)
    for (const engine of plane.description.discPropellers?.engines ?? [])
      for (const disc of engine) assert.equal(model.mesh.getObjectByName(disc).visible, false, `${name} hides its disc ${disc}`)
    model.mesh.updateMatrixWorld(true)
    // the plane's own frame, where its nose is -z: a point of the blades turns about the shaft, keeping its distance
    // from the middle of its disc, which stays put
    const local = point => model.mesh.worldToLocal(point)
    // the corner of its blades farthest from their middle, a blade tip
    const tip = propeller => {
      const centre = middle(propeller)
      let part
      propeller.traverse(child => {
        part ??= child.isMesh ? child : undefined
      })
      const { index, attributes: { position } } = part.geometry
      const world = i => new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(part.matrixWorld)
      const far = index.array.reduce((best, i) => world(i).distanceTo(centre) > world(best).distanceTo(centre) ? i : best)
      return () => local(world(far))
    }
    const tips = model.propellers.map(tip)
    const before = model.propellers.map(propeller => local(middle(propeller)))
    const was = tips.map(place => place())
    model.update(.05, .05)
    model.mesh.updateMatrixWorld(true)
    model.propellers.forEach((propeller, i) => {
      const now = tips[i]()
      assert.ok(now.distanceTo(was[i]) > .05, `${name} propeller ${i + 1} turns`)
      assert.ok(Math.abs(now.distanceTo(before[i]) / was[i].distanceTo(before[i]) - 1) < .01, `${name} propeller ${i + 1} keeps its shape`)
      assert.ok(local(middle(propeller)).distanceTo(before[i]) < .05, `${name} propeller ${i + 1} wobbles off its shaft`)
    })
    model.end()
  }
  let triangles = 0
  loadedModel((await import('/core3d/aircraft/derived/Liberator.js')).description.model).traverse(part => {
    if (part.isMesh) triangles += part.geometry.index.count / 3
  })
  assert.equal(triangles, 25971, 'splitting the B-24 propellers kept every triangle')
})
