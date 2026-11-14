import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Avionce, Enemy, Plamen, GameSession

before(async() => {
  createPageElements()
  ;({ Avionce } = await import('/scenes/vis/Avionce.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Plamen = (await import('/core/actor/Plamen.js')).default
  GameSession = (await import('/core/runtime/GameSession.js')).default
})

test('a new player life cannot show fire particles at the previous crash site', t => {
  const session = new GameSession()
  session.start()
  const player = new Avionce({ session })
  t.after(() => {
    player.end()
    session.dispose()
  })
  player.plamen = new Plamen()
  player.postavi(100, 150)
  player.umri()
  player.azurirajPlamen(1 / 60)
  assert.ok(player.plamen.iskre.length > 0)

  player.visina = 100
  player.reset()
  assert.equal(player.plamen.iskre.length, 0)
  player.postavi(600, 450)
  player.umri()
  assert.deepEqual([player.plamen.x, player.plamen.y], [600, 450])
  assert.equal(player.plamen.iskre.length, 0, 'nothing from the old fire can render before the next update')
  player.azurirajPlamen(1 / 60)
  assert.ok(player.plamen.iskre.length > 0)
  for (const spark of player.plamen.iskre) {
    assert.ok(Math.abs(spark.x - 600) <= 1)
    assert.ok(Math.abs(spark.y - 450) <= 4)
  }
})

test('enemy ignition starts at its current position and preserves an already burning trail on death', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const enemy = new Enemy({ session, type: 'heavy' })
  enemy.plamen = new Plamen(100, 100)
  enemy.plamen.update(1 / 60)
  enemy.postavi(500, 350)
  enemy.damage(enemy.maxHits / 2)
  assert.equal(enemy.plamen.iskre.length, 0)
  assert.deepEqual([enemy.plamen.x, enemy.plamen.y], [500, 350])
  enemy.azurirajPlamen(1 / 60)
  const trail = [...enemy.plamen.iskre]
  assert.ok(trail.length > 0)
  enemy.damage(enemy.maxHits)
  assert.equal(enemy.dead, true)
  assert.deepEqual(enemy.plamen.iskre, trail)
})
