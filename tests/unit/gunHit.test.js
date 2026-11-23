import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import GunHit, { gunHit } from '/core3d/actor/artillery/GunHit.js'
import Body from '/core/gameplay/bodies/Body.js'
import { impactLife } from '/core3d/actor/artillery/GunImpactCloud.js'

test('a hit on the gun throws sparks off its front and jolts it back, and both settle at any frame rate', t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  for (const fps of [30, 60]) {
    const body = { hitsTaken: 0 }
    const gun = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3))
    const hit = new GunHit(body, gun)
    // the gun's model places it again every frame, before the hit moves it
    const frame = () => {
      gun.position.set(0, 0, 0)
      hit.update(1 / fps)
    }
    frame()
    assert.equal(hit.mesh.visible, false)
    body.hitsTaken++
    frame()
    assert.equal(hit.mesh.visible, true)
    assert.ok(hit.mesh.position.z < -1.4, 'the sparks fly off the front, which faces -z')
    assert.ok(gun.position.z > 0, 'it is jolted back')
    for (let time = 0; time < gunHit.settle + gunHit.rounds * gunHit.step; time += 1 / fps) frame()
    assert.equal(gun.position.z, 0)
    assert.equal(hit.mesh.visible, false)
    hit.end()
  }
})

test('catalog hits use brief sparks, dust and chips, reserving smoke and fragments for heavier damage', t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  for (const fps of [30, 60]) {
    const body = new Body(), gun = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3))
    const hit = new GunHit(body, gun, { detailed: true })
    const frame = (dt = 1 / fps) => {
      gun.position.set(0, 0, 0)
      hit.update(dt)
    }
    const play = seconds => {
      for (let i = 0; i < seconds * fps; i++) frame()
    }
    frame()
    body.takeHit(10)
    frame()
    assert.ok(hit.cloud.dust.mesh.visible && hit.cloud.chips.mesh.visible)
    assert.equal(hit.cloud.smoke.mesh.visible, false)
    assert.equal(hit.cloud.fragments.visible, false)
    assert.ok(hit.sparks.mesh.position.distanceTo(hit.cloud.mesh.position) < 1e-8, 'all effects start at the same impact')
    const dust = hit.cloud.dust.mesh.geometry.attributes.position.array.slice()
    frame(0)
    assert.deepEqual(hit.cloud.dust.mesh.geometry.attributes.position.array, dust, 'a paused frame advances no particle')
    play(.12)
    assert.equal(hit.sparks.mesh.visible, false, 'catalog sparks fade sooner than the old .2 second burst')
    assert.ok(hit.cloud.dust.mesh.visible, 'dust briefly remains after the flash')
    play(.6)
    assert.equal(hit.mesh.visible, false)
    body.takeHit(40)
    frame()
    assert.ok(hit.cloud.smoke.mesh.visible)
    assert.equal(hit.cloud.fragments.visible, false)
    body.takeHit(25)
    frame()
    assert.ok(hit.cloud.fragments.visible)
    assert.equal(hit.cloud.fragments.count, 3)
    const pool = hit.cloud.fragments.instanceMatrix
    body.takeHit(25)
    frame()
    assert.equal(hit.cloud.fragments.count, 5)
    assert.equal(hit.cloud.fragments.instanceMatrix, pool, 'hits reuse a bounded fragment pool')
    assert.equal(hit.cloud.mesh.children.length, 4)
    play(.5)
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < hit.cloud.fragments.count; i++) {
      hit.cloud.fragments.getMatrixAt(i, matrix)
      const point = new THREE.Vector3().setFromMatrixPosition(matrix).add(hit.cloud.mesh.position)
      assert.ok(point.y >= .044, 'falling pieces stay above the floor')
    }
    play(impactLife.smoke)
    assert.equal(hit.mesh.visible, false, 'all effects finish without accumulating or restarting on a wreck')
    let textureDisposals = 0, instanceDisposals = 0
    hit.cloud.texture.addEventListener('dispose', () => textureDisposals++)
    hit.cloud.fragments.addEventListener('dispose', () => instanceDisposals++)
    hit.end()
    assert.equal(textureDisposals, 1, 'dust and smoke share and dispose one texture')
    assert.equal(instanceDisposals, 1)
  }
})

test('selecting dead directly in the catalog emits one final puff without requiring a health hit', t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const body = new Body({ states: { idle: {}, dead: {} } }), gun = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3))
  const hit = new GunHit(body, gun, { detailed: true })
  body.setState('dead')
  hit.update(1 / 60)
  assert.equal(body.hitsTaken, 0)
  assert.ok(hit.cloud.smoke.mesh.visible)
  assert.equal(hit.cloud.fragments.count, 5)
  for (let i = 0; i < 180; i++) hit.update(1 / 60)
  assert.equal(hit.mesh.visible, false)
  hit.end()
})
