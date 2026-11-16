import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Avionce, Enemy, Flame, GameSession

before(async() => {
  createPageElements()
  ;({ Avionce } = await import('/scenes/vis/Avionce.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Flame = (await import('/core/actor/Flame.js')).default
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
  player.flame = new Flame()
  player.setPosition(100, 150)
  player.die()
  player.updateFlame(1 / 60)
  assert.ok(player.flame.sparks.length > 0)

  player.height = 100
  player.reset()
  assert.equal(player.flame.sparks.length, 0)
  player.setPosition(600, 450)
  player.die()
  assert.deepEqual([player.flame.x, player.flame.y], [600, 450])
  assert.equal(player.flame.sparks.length, 0, 'nothing from the old fire can render before the next update')
  player.updateFlame(1 / 60)
  assert.ok(player.flame.sparks.length > 0)
  for (const spark of player.flame.sparks) {
    assert.ok(Math.abs(spark.x - 600) <= 1)
    assert.ok(Math.abs(spark.y - 450) <= 4)
  }
})

test('enemy ignition starts at its current position and preserves an already burning trail on death', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const enemy = new Enemy({ session, type: 'heavy' })
  enemy.flame = new Flame(100, 100)
  enemy.flame.update(1 / 60)
  enemy.setPosition(500, 350)
  enemy.damage(enemy.maxHits / 2)
  assert.equal(enemy.flame.sparks.length, 0)
  assert.deepEqual([enemy.flame.x, enemy.flame.y], [500, 350])
  enemy.updateFlame(1 / 60)
  const trail = [...enemy.flame.sparks]
  assert.ok(trail.length > 0)
  enemy.damage(enemy.maxHits)
  assert.equal(enemy.dead, true)
  assert.deepEqual(enemy.flame.sparks, trail)
})
