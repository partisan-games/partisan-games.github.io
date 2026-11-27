import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { createPageElements } from './helpers/dom.js'

test('the shared Renault view animates only its belts and freezes, reverses and steers them', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const { description } = await import('/core3d/actor/derived/Tank.js')
  const file = readFileSync('assets/models/tank/renault-ft/textured.fbx')
  const original = new FBXLoader().parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), '')
  const mesh = original.getObjectByName('GUN_FT17P_LP')
  const body = new Character()
  const view = new CharacterModel(body, { mesh: original, partMotion: description.partMotion })
  const animated = view.mesh.getObjectByName(mesh.name)
  assert.deepEqual(animated.geometry.attributes.position.array, mesh.geometry.attributes.position.array)
  assert.deepEqual(animated.geometry.groups.map(({ count }) => count), [2052, 270, 270])
  const originalUV = mesh.geometry.attributes.uv
  const animatedUV = animated.geometry.attributes.uv
  assert.equal(animatedUV.getX(200), originalUV.getX(200))
  assert.notEqual(animatedUV.getX(510), originalUV.getX(510))
  const [, left, right] = animated.material
  const phases = () => [left.map.offset.x, right.map.offset.x]
  assert.deepEqual(phases(), [0, 0])
  body.setState('move')
  body.update(.016)
  view.update(.016)
  const forward = phases()
  assert.equal(forward[0], forward[1])
  assert.notEqual(forward[0], 0)
  view.update(.016)
  assert.deepEqual(phases(), forward)
  body.x = 0
  view.update(.016)
  assert.ok(phases().every(phase => Math.min(phase, 1 - phase) < 1e-9))
  body.yaw = .03
  view.update(.016)
  const [a, b] = phases()
  assert.ok(a > 0 && b > 0)
  assert.ok(Math.abs(a + b - 1) < 1e-9)
  assert.equal(mesh.material, animated.material[0])
  view.end()
})
