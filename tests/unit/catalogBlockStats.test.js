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

test('the catalog shows the planes their real mass, top speed and guns, as it does the tanks', async() => {
  const { description: bomber } = await import('/core3d/aircraft/derived/Bomber.js')
  const { description: fighter } = await import('/core3d/aircraft/derived/Messerschmitt.js')
  const { default: Transport } = await import('/core/gameplay/bodies/aircraft/Transport.js')
  const text = body => blockStats(body).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  assert.match(text({ physical: bomber.physical }), /Masa 16,7 t Brzina 454 km\/h Naoružanje 8 × 7,7 mm Browning/)
  assert.match(text({ physical: fighter.physical }), /Masa 2,2 t Brzina 530 km\/h/)
  assert.match(text(new Transport()), /Masa 5,7 t Brzina 265,5 km\/h/)
})
