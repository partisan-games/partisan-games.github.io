import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import GunHit, { gunHit } from '/core3d/actor/artillery/GunHit.js'

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
