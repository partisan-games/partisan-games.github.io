import { test } from 'node:test'
import assert from 'node:assert/strict'
import fightingPlace from '/scenes/drvar/fightingPlace.js'

const stronghold = { x: 0, z: 0 }
const choose = (soldier, spots) => fightingPlace(soldier, { spots, target: stronghold, range: 50, reach: 40, behind: 1 })

test('a paratrooper runs to a free cover ahead of him and stands just beyond it, as seen from the stronghold', () => {
  const near = { x: 30, z: 0, height: 1.2, taken: false }, farther = { x: 20, z: 30, height: 1, taken: false }
  assert.deepEqual(choose({ x: 40, z: 0 }, [farther, near]), { x: 31, z: 0, cover: 1.2 })
  assert.equal(near.taken, true)
  assert.deepEqual(choose({ x: 40, z: 0 }, [near]), null, 'a taken cover is no one else\'s')
})

test('one who lands near the stronghold does not run back to a cover behind him, but fights at once', () => {
  const behindHim = { x: 25, z: 0, height: 1.2, taken: false }
  assert.equal(choose({ x: 14, z: 0 }, [behindHim]), null)
  assert.equal(behindHim.taken, false)
})

test('one who lands by the stronghold crouches outside its wall, on the side the wall faces out, where the defenders see him', () => {
  const wall = { x: 12, z: 4, height: 1.1, taken: false, out: { x: 1, z: 0 } }
  assert.deepEqual(choose({ x: 15, z: 6 }, [wall, { x: 25, z: 0, height: 1.2, taken: false }]), { x: 13, z: 4, cover: 1.1, overlooked: true })
})

test('one who lands out of range does not take a cover out of range, but runs in the open to fire from within it', () => {
  const outOfRange = { x: 60, z: 0, height: 1.2, taken: false }
  const goal = choose({ x: 80, z: 0 }, [outOfRange])
  assert.deepEqual(goal, { x: 45, z: 0 })
  assert.equal(outOfRange.taken, false)
})

test('one out of range takes a cover within it on his way in', () => {
  assert.deepEqual(choose({ x: 70, z: 0 }, [{ x: 40, z: 0, height: 1.2, taken: false }]), { x: 41, z: 0, cover: 1.2 })
})

test('a cover from which the stronghold cannot be seen, as one behind a house, is none for him', () => {
  const unseen = { x: 30, z: 0, height: 1.2, taken: false }
  const goal = fightingPlace({ x: 40, z: 0 }, { spots: [unseen], target: stronghold, range: 50, reach: 40, behind: 1, inSight: () => false })
  assert.equal(goal, null)
  assert.equal(unseen.taken, false)
})

test('one who would not see the stronghold from where he stands goes to the nearest free stretch of its wall', () => {
  const wall = { x: 0, z: 10, height: 1.1, taken: false, out: { x: 0, z: 1 } }
  const goal = fightingPlace({ x: 0, z: 40 }, { spots: [wall], target: stronghold, range: 50, reach: 40, behind: 1,
    inSight: point => Math.hypot(point.x, point.z) < 20 })
  assert.deepEqual(goal, { x: 0, z: 11, cover: 1.1, overlooked: true })
})
