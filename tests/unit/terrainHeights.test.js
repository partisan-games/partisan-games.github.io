import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

register('./setup/ammo-node.js', import.meta.url)
let Ammo, createTerrainBodyFromData
const terrain = data => createTerrainBodyFromData({ data, width: 4, depth: 4, mapWidth: 30, mapDepth: 30, minHeight: 0, maxHeight: 5 })

before(async() => {
  ;({ Ammo, createTerrainBodyFromData } = await import('/core3d/physics/index.js'))
  // Ammo replaces its _malloc with the real one on the first call, which would slip past a mock
  terrain(Array(16).fill(-1))
})

test('a terrain built again with the same heights reuses their copy in the Ammo heap, which cannot be freed', t => {
  const heights = Array.from({ length: 16 }, (_, i) => i % 5)
  const malloc = t.mock.method(Ammo, '_malloc')
  for (let entry = 0; entry < 5; entry++) terrain([...heights])
  assert.equal(malloc.mock.callCount(), 1)
  terrain(heights.map(height => height + .5))
  assert.equal(malloc.mock.callCount(), 2, 'other heights get their own copy')
})
