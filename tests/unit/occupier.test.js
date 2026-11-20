import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Occupier, occupier, mouse

before(async() => {
  createPageElements()
  ;({ default: Occupier, occupier } = await import('/core/actor/Occupier.js'))
  mouse = (await import('/core/io/mouse.js')).default
})

/** An occupier alone, counting the frames he fires at the viewer. */
function occupierAlone({ heading = 1 } = {}) {
  const fired = []
  const soldier = new Occupier({ x: 100, y: 300, heading, callback: dt => fired.push(dt) })
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) soldier.update(1 / 30)
  }
  return { soldier, fired, live }
}

test('an occupier has the states walk, fire and dead, and walks the way he faces until set to another', () => {
  for (const heading of [1, -1]) {
    const { soldier, fired, live } = occupierAlone({ heading })
    assert.deepEqual(soldier.states, ['walk', 'fire', 'dead'])
    assert.equal(soldier.state, 'walk')
    assert.equal(soldier.forward, heading)
    live(1)
    assert.ok(Math.abs(soldier.x - (100 + heading * occupier.speed)) < 1e-9)
    assert.equal(soldier.defaultAnimation, heading > 0 ? 'nadesno' : 'nalevo')
    assert.equal(fired.length, 0, 'he fires only when set to')
  }
})

test('an occupier set to fire stands and fires every frame until he falls', () => {
  const { soldier, fired, live } = occupierAlone()
  soldier.setState('fire')
  const { x } = soldier
  live(1)
  assert.equal(soldier.x, x, 'he stands')
  assert.equal(fired.length, 30)
  assert.equal(soldier.hasFired, true)
  soldier.setState('dead')
  assert.equal(soldier.dead, true)
  assert.equal(soldier.hasFired, false)
  live(1)
  assert.equal(fired.length, 30)
})

test('a dead occupier gives no more points when clicked', t => {
  const { soldier } = occupierAlone()
  t.mock.method(mouse, 'isOver', () => true)
  let points = 0
  soldier.checkHit(() => points++)
  soldier.checkHit(() => points++)
  assert.equal(points, 1)
  assert.equal(soldier.state, 'dead')
})
