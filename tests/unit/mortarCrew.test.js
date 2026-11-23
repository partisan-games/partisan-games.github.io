import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import MortarCrew, { models } from '/core3d/actor/artillery/MortarCrew.js'

const play = (crew, seconds) => {
  for (let frame = 0; frame < seconds * 60; frame++) crew.update(1 / 60)
}

test('the actual Italian mortar crew loads, fires once, stops on casualties and finishes its falls', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  for (const Loader of [GLTFLoader, FBXLoader]) t.mock.method(Loader.prototype, 'loadAsync', async url => {
    const data = await readFile(new URL(`../..${url}`, import.meta.url))
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    const loader = new Loader()
    return loader.parseAsync ? loader.parseAsync(buffer, '') : loader.parse(buffer, '')
  })
  await requestModels(models)
  const crew = new MortarCrew()
  crew.mesh.rotation.y = .95
  crew.mesh.position.set(3, .7, -2)
  crew.update(0)
  assert.equal(crew.ready, true)
  crew.setState('load')
  play(crew, 2)
  assert.equal(crew.state, 'load')
  assert.equal(crew.shotsFired, 0)
  const muzzle = crew.muzzle.getWorldPosition(new THREE.Vector3())
  const tail = crew.round.getWorldPosition(new THREE.Vector3())
  assert.ok(muzzle.distanceTo(tail) < .03, 'round tail is aligned above the actual opening')
  const loader = crew.members[1]
  for (const [hand, y, x] of [[loader.pose.left, .10, -.027], [loader.pose.right, .22, .027]]) {
    const gap = hand.getWorldPosition(new THREE.Vector3()).distanceTo(crew.round.localToWorld(new THREE.Vector3(x, y, 0)))
    assert.ok(gap < .06, `loader holds the round: ${gap}`)
  }
  crew.setState('attack')
  play(crew, .5)
  assert.equal(crew.shotsFired, 1)
  assert.equal(crew.round.visible, false)
  play(crew, 3)
  assert.equal(crew.shotsFired, 1)
  assert.equal(crew.state, 'idle')
  crew.setState('attack')
  play(crew, .2)
  crew.takeHit(48)
  assert.equal(crew.ready, false)
  assert.equal(crew.health.current, 48)
  crew.setState('attack')
  play(crew, 3)
  assert.equal(crew.shotsFired, 1, 'a casualty interrupts the cycle before release')
  crew.setState('dead')
  play(crew, 3)
  assert.equal(crew.state, 'dead')
  assert.equal(crew.round.visible, false)
  for (const member of crew.members) {
    assert.equal(member.mixer, null)
    crew.mesh.updateMatrixWorld(true)
    member.figure.traverse(part => part.skeleton?.update())
    const bottom = new THREE.Box3().setFromObject(member.figure, true).min.y
    assert.ok(Math.abs(bottom - .7) < .01, `fallen operator rests on translated ground: ${bottom}`)
  }
  crew.setState('idle')
  assert.equal(crew.state, 'dead', 'only catalog Reset creates a fresh team')
  assert.equal(new MortarCrew().health.current, 96)
})
