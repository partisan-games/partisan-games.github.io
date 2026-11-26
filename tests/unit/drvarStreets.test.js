import { test } from 'node:test'
import assert from 'node:assert/strict'
import Streets from '/scenes/drvar/Streets.js'

const house = { min: { x: -2, z: -5 }, max: { x: 2, z: 5 } }

test('a man runs straight where no house stands in his way', () => {
  assert.deepEqual(new Streets([house]).route({ x: -10, z: 8 }, { x: 10, z: 8 }), [])
})

test('a house in his way he goes round by its nearer corners, off its walls', () => {
  const streets = new Streets([house], .5)
  const via = streets.route({ x: -10, z: 1 }, { x: 10, z: 1 })
  assert.deepEqual(via, [{ x: -2.5, z: 5.5 }, { x: 2.5, z: 5.5 }])
  const legs = [{ x: -10, z: 1 }, ...via, { x: 10, z: 1 }]
  for (let i = 1; i < legs.length; i++) assert.ok(streets.clear(legs[i - 1], legs[i]))
})

test('the block he stands in, as the yard he came down in, does not hold him', () => {
  assert.deepEqual(new Streets([house]).route({ x: 0, z: 0 }, { x: 10, z: 0 }), [])
})
