import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { register } from 'node:module'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Escort from '/core/gameplay/controllers/Escort.js'
import NearestTarget from '/core/gameplay/controllers/NearestTarget.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'

register('./setup/ammo-node.js', import.meta.url)

test('the Kraljevo scene fields five distinct escorts against eight German defenders', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async() => ({
    scene: new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4)), animations: [],
  }))
  const { default: Kraljevo } = await import('/scenes/3d-tank/Main.js')
  const { posts, defence } = await import('/scenes/3d-tank/kraljevo.js')
  const cleanups = [], objects = []
  const scene = {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), controllers: [],
    session: { scope: { add: cleanup => cleanups.push(cleanup) }, clock: new GameClock() },
    add: (...items) => objects.push(...items), addMesh(mesh) {
      this.scene.add(mesh)
    },
    ui: { scoreUI: (label, value) => [label, value] },
  }
  t.after(() => {
    for (const object of objects) object.end?.()
    for (const cleanup of cleanups) cleanup()
  })
  await Kraljevo.prototype.init.call(scene)
  assert.deepEqual(Kraljevo.prototype.sceneUI.call(scene), ['Comrades', 5])
  assert.equal(new Set(scene.comrades.map(({ x, z }) => `${x},${z}`)).size, 5)
  assert.equal(scene.controllers.filter(controller => controller instanceof Escort).length, 5)
  const viewOf = body => objects.find(object => object.body === body && object.mesh)
  const [, , , rifleman, furCap] = scene.comrades
  assert.ok(viewOf(rifleman).mesh.getObjectByName('Partisan').material.some(material => material.name === 'cockade'))
  assert.ok(viewOf(furCap).mesh.getObjectByName('Šubara'))

  assert.equal(scene.enemies.length, 8)
  assert.equal(posts.filter(({ arm }) => arm === 'machineGun').length, 2)
  const targetPickers = scene.controllers.filter(controller => controller instanceof NearestTarget)
  for (const [i, { x, z, arm }] of posts.entries()) {
    const enemy = scene.enemies[i]
    assert.deepEqual([enemy.x, enemy.z, enemy.reach], [x, z, defence[arm].reach])
    assert.ok(enemy.reach > furCap.reach)
    assert.ok(targetPickers[i].candidates.includes(rifleman))
    assert.ok(targetPickers[i].candidates.includes(furCap))
  }
})
