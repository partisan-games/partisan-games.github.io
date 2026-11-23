import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { requestModel, loadedModel } from '/core3d/assets/models.js'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function figure(animated = false) {
  const mesh = new THREE.Group()
  mesh.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()))
  mesh.animations = animated ? [new THREE.AnimationClip('original', .75, [])] : []
  return mesh
}

test('parallel loading starts the body and motion together, waits for both and keeps the prepared-model cache', { timeout: 3000 }, async t => {
  const body = deferred(), motion = deferred(), bothStarted = deferred()
  const starts = []
  t.mock.method(FBXLoader.prototype, 'loadAsync', url => {
    starts.push(url)
    if (starts.length === 2) bothStarted.resolve()
    return url.endsWith('model.fbx') ? body.promise : motion.promise
  })
  const descriptor = { prefix: 'parallel-test/', file: 'model.fbx', size: 2, animDict: { death: 'Fall' } }
  const loading = requestModel(descriptor, { parallelAnimations: true })
  assert.equal(requestModel({ ...descriptor }), loading, 'strategy never duplicates or changes the prepared-model identity')
  await bothStarted.promise
  assert.deepEqual(new Set(starts), new Set(['/assets/models/parallel-test/model.fbx', '/assets/models/parallel-test/Fall.fbx']))
  let ready = false
  loading.then(() => {
    ready = true
  })
  body.resolve(figure())
  await new Promise(resolve => {
    setImmediate(resolve)
  })
  assert.equal(ready, false, 'a finished body cannot make the scene ready while its motion is pending')
  assert.throws(() => loadedModel(descriptor), /before it has loaded/)
  motion.resolve(figure(true))
  const prepared = await loading
  assert.equal(loadedModel(descriptor), prepared)
  assert.deepEqual(prepared.userData.animations.map(clip => clip.name), ['Fall'])
  assert.equal(prepared.userData.animations[0].duration, .75)
  assert.equal(descriptor.file, 'model.fbx', 'loading does not rewrite the caller description')
})

test('without the opt-in, animations still finish before the body starts', { timeout: 3000 }, async t => {
  const motion = deferred(), motionStarted = deferred()
  const starts = []
  t.mock.method(FBXLoader.prototype, 'loadAsync', url => {
    starts.push(url)
    if (url.endsWith('Fall.fbx')) {
      motionStarted.resolve()
      return motion.promise
    }
    return Promise.resolve(figure())
  })
  const loading = requestModel({ prefix: 'serial-test/', file: 'model.fbx', animDict: { death: 'Fall' } })
  await motionStarted.promise
  assert.deepEqual(starts, ['/assets/models/serial-test/Fall.fbx'])
  motion.resolve(figure(true))
  const prepared = await loading
  assert.equal(starts[1], '/assets/models/serial-test/model.fbx')
  assert.deepEqual(prepared.userData.animations.map(clip => clip.name), ['Fall'])
})

test('a failed parallel motion load stays unusable and can be retried without stale animations', async t => {
  let failing = true, attempts = 0
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    if (!url.endsWith('Fall.fbx')) return figure()
    attempts++
    if (failing) throw new Error('motion unavailable')
    return figure(true)
  })
  const descriptor = { prefix: 'retry-parallel-test/', file: 'model.fbx', animDict: { death: 'Fall' } }
  const failed = requestModel(descriptor, { parallelAnimations: true })
  await assert.rejects(failed, /motion unavailable/)
  assert.throws(() => loadedModel(descriptor), /before it has loaded/)
  failing = false
  const retry = requestModel(descriptor, { parallelAnimations: true })
  assert.notEqual(retry, failed)
  const prepared = await retry
  assert.equal(attempts, 2)
  assert.deepEqual(prepared.userData.animations.map(clip => clip.name), ['Fall'])
})
