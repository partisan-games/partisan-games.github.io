import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blockStats } from '/catalog/blockStats.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import Tank from '/core/gameplay/bodies/vehicles/Tank.js'
import GameClock from '/core/runtime/GameClock.js'

test('the catalog shows a tank model its real mass, top speed and gun, not balance shares', () => {
  const tiger = new Tank({ clock: new GameClock(), performance: modelPerformance['tiger-i'] })
  const text = blockStats(tiger).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  assert.match(text, /Masa 57 t/)
  assert.match(text, /Brzina 45 km\/h/)
  assert.match(text, /Naoružanje 88 mm KwK 36/)
  assert.doesNotMatch(text, /%/)
})
