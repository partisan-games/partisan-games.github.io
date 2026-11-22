import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRandomBoxes as originalBoxes } from '/core3d/geometry/index.js'
import createRandomBoxes from '/scenes/avatar/createRandomBoxes.js'

const seeded = seed => {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}
const intersects = (a, b) => Math.abs(a.x - b.x) < 5 && Math.abs(a.y - b.y) < 5 && Math.abs(a.z - b.z) < 5
const dispose = boxes => boxes.forEach(box => {
  box.geometry.dispose()
  box.material.dispose()
})

test('the Avatar keeps its original random scatter, changing only intersecting positions', t => {
  let changed = 0
  for (let seed = 0; seed < 20; seed++) {
    t.mock.method(Math, 'random', seeded(seed))
    const original = originalBoxes({ n: 400, mapSize: 200 })
    t.mock.method(Math, 'random', seeded(seed))
    const result = createRandomBoxes({ n: 400, mapSize: 200 })
    assert.equal(result.length, 400)
    for (let i = 0; i < result.length; i++) {
      const { position } = result[i]
      const conflicted = result.slice(0, i).some(box => intersects(original[i].position, box.position))
      if (!conflicted) assert.ok(position.equals(original[i].position), 'a clear original position stays exactly as it was')
      else changed++
      assert.equal(result[i].material.color.getHex(), original[i].material.color.getHex())
      assert.equal(result[i].geometry.parameters.width, 5)
      assert.ok(position.x >= -100 && position.x <= 100 && position.z >= -100 && position.z <= 100)
      assert.ok(position.y >= -5 && position.y <= 50)
      for (let j = 0; j < i; j++) assert.equal(intersects(position, result[j].position), false)
    }
    dispose(original)
    dispose(result)
  }
  assert.ok(changed > 0, 'the seeds exercise actual overlapping cubes')
  assert.ok(changed < 400 * 20 * .2, 'most of the original scatter survives')
})

test('an impossible repeated draw stops after the bounded number of attempts', t => {
  const random = t.mock.method(Math, 'random', () => .5)
  const original = originalBoxes({ n: 2, mapSize: 1 })
  const initialCalls = random.mock.callCount()
  dispose(original)
  assert.throws(() => createRandomBoxes({ n: 2, mapSize: 1, maxAttempts: 3 }), RangeError)
  assert.equal(random.mock.callCount() - initialCalls, initialCalls + 3 * 3, 'only three extra position draws')
})
