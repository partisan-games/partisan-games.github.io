import { test } from 'node:test'
import assert from 'node:assert/strict'
import coverGoal from '/scenes/drvar/coverGoal.js'

const stronghold = { x: 0, z: 0 }
const choose = (soldier, spots) => coverGoal(soldier, { spots, target: stronghold, reach: 40, behind: 1 })

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
