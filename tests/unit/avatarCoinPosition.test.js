import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Vector3 } from 'three'
import coinPosition from '/scenes/avatar/coinPosition.js'
import { createBox } from '/core3d/geometry/index.js'

const box = (x, y, z) => new Box3(new Vector3(x - 2.5, y, z - 2.5), new Vector3(x + 2.5, y + 5, z + 2.5))
const intersects = (point, radius, solid) => new Box3(point.clone().addScalar(-radius), point.clone().addScalar(radius)).intersectsBox(solid)

test('a clear coin retains exactly its original position and no cubes move', () => {
  const support = box(0, 0, 0), original = new Vector3(0, 6.15, 0)
  assert.deepEqual(coinPosition(original, support, [support, box(10, 0, 0)], 1), original)
})

test('a coin partly inside a neighbouring cube moves sideways above the same support before being raised', () => {
  const support = box(0, 0, 0), obstacle = box(3.6, 5, 0), original = new Vector3(.2, 6.15, 0)
  const snapshot = obstacle.clone()
  const next = coinPosition(original, support, [support, obstacle], 1)
  assert.equal(next.y, original.y)
  assert.equal(intersects(next, 1, obstacle), false)
  assert.ok(next.x >= -1.5 && next.x <= 1.5 && next.z >= -1.5 && next.z <= 1.5)
  assert.deepEqual(obstacle, snapshot)
  assert.deepEqual(original, new Vector3(.2, 6.15, 0))
})

test('a fully covered coin is raised above the obstruction without changing its supporting column', () => {
  const support = box(0, 0, 0), ceiling = box(0, 5, 0)
  const next = coinPosition(new Vector3(0, 6.15, 0), support, [support, ceiling], 1)
  assert.ok(next.y > 11)
  assert.equal(next.x, 0)
  assert.equal(next.z, 0)
  assert.equal(intersects(next, 1, ceiling), false)
})

test('moving a covered coin upwards also avoids the clear coin above the upper cube', () => {
  const support = box(0, 0, 0), ceiling = box(0, 5, 0)
  const otherCoin = new Box3(new Vector3(-1, 10.15, -1), new Vector3(1, 12.15, 1))
  const next = coinPosition(new Vector3(0, 6.15, 0), support, [support, ceiling, otherCoin], 1)
  assert.equal(intersects(next, 1, ceiling), false)
  assert.equal(intersects(next, 1, otherCoin), false)
})

test('the scene relocates only its obstructed coin and leaves the cubes and clear coins intact', async t => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  t.mock.method(Math, 'random', () => .5) // no optional platforms in this geometry case
  const boxes = Array.from({ length: 100 }, (_, i) => createBox({ size: 5, pos: new Vector3(i * 20, 0, 0) }))
  boxes[1].position.set(0, 5, 0)
  const positions = boxes.map(mesh => mesh.position.clone())
  const scene = { boxes, solids: [], add() {} }
  AvatarScene.prototype.createCoins.call(scene, boxes)
  const bounds = boxes.map(mesh => new Box3().setFromObject(mesh))
  assert.equal(scene.coins.length, 100)
  for (let i = 0; i < 100; i++) {
    const { mesh } = scene.coins[i]
    const { radius } = mesh.geometry.boundingSphere
    for (const solid of bounds) assert.equal(intersects(mesh.position, radius, solid), false)
    assert.deepEqual(boxes[i].position, positions[i])
    if (i > 0) assert.deepEqual(mesh.position, positions[i].clone().add(new Vector3(0, 6.15, 0)))
  }
})
