import { test } from 'node:test'
import assert from 'node:assert/strict'
import World from '/core/World.js'
import { createPageElements } from './helpers/dom.js'

test('world cleanup continues after failing controllers and actors, clears ownership and reports every failure', () => {
  const world = new World(), ended = []
  const first = new Error('controller'), second = new Error('actor')
  world.controllers.push({ end() {
    ended.push('controller'); throw first
  } })
  const actor = { end() {
    ended.push('actor'); throw second
  } }
  world.add(actor, { end() {
    ended.push('last')
  } })
  assert.throws(() => world.end(actor), error => error instanceof AggregateError &&
    error.errors[0] === first && error.errors[1] === second)
  assert.deepEqual(ended, ['controller', 'actor', 'last'])
  assert.deepEqual(world.objects, [])
  assert.deepEqual(world.controllers, [])
  world.end()
  assert.deepEqual(ended, ['controller', 'actor', 'last'])
})

test('a failed actor cannot prevent session, UI, input and 3D cleanup', async t => {
  createPageElements()
  const { default: Scene } = await import('/core/Scene.js')
  const { default: Scene3D } = await import('/core/Scene3D.js')
  const scene = new Scene({ canvas: document.getElementById('platno'), disableEvents: true })
  const error = new Error('actor cleanup')
  const ended = []
  scene.world.add({ end() {
    throw error
  } }, { end() {
    ended.push('actor')
  } })
  t.mock.method(scene, 'syncSounds', () => {})
  t.mock.method(scene.ui, 'end', () => ended.push('ui'))
  scene.session.scope.add(() => ended.push('scope'))
  scene.pausePolicy = { end: () => ended.push('input') }
  scene.controls = { dispose: () => ended.push('controls') }
  scene.disposeScene = () => ended.push('gpu')
  assert.throws(() => Scene3D.prototype.end.call(scene), thrown => thrown === error)
  assert.equal(scene.session.state, 'disposed')
  assert.deepEqual(ended, ['actor', 'scope', 'ui', 'input', 'controls', 'gpu'])
  assert.equal(scene.canvas.style.display, 'none')
})

test('a broken GPU resource does not stop the other meshes, materials or background being released', async() => {
  createPageElements()
  const { default: Scene3D } = await import('/core/Scene3D.js')
  const error = new Error('geometry'), disposed = []
  const material = { map: { isTexture: true, dispose: () => disposed.push('texture') }, dispose: () => disposed.push('material') }
  const scene = {
    traverse(visit) {
      visit({ geometry: { dispose() {
        throw error
      } }, material })
      visit({ geometry: { dispose: () => disposed.push('geometry') } })
    },
    background: { isTexture: true, dispose: () => disposed.push('background') },
  }
  assert.throws(() => Scene3D.prototype.disposeScene.call({ scene }), thrown => thrown === error)
  assert.deepEqual(disposed, ['texture', 'material', 'geometry', 'background'])
})
