import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let WaterEffects
before(async() => {
  createPageElements()
  WaterEffects = (await import('/scenes/camac/WaterEffects.js')).default
})

function setup() {
  const session = { state: 'running', clock: { now: 0 } }
  const effects = new WaterEffects({ session, coast: {}, viewLeft: () => 0 })
  const boat = { x: 120, y: 200, sirina: 100, visina: 30, vidljiv: true, dead: false }
  return { effects, session, boat }
}

test('wake spacing follows traveled distance and marks stay in world space', () => {
  const { effects, boat } = setup()
  effects.trail(boat, { x: 0, y: 200 }, 1)
  assert.equal(effects.wakeIndex, 10)
  const positions = effects.wakes.slice(0, 10).map(mark => [mark.x, mark.y])
  boat.x = 0
  effects.update(.1)
  assert.deepEqual(effects.wakes.slice(0, 10).map(mark => [mark.x, mark.y]), positions)
  effects.trail(boat, { x: 120, y: 200 }, 1)
  assert.ok(effects.wakes[10].x > boat.x, 'reverse travel leaves foam behind its direction of motion')
})

test('stationary boats emit nothing; effects pause, expire and reuse bounded storage', () => {
  const { effects, boat, session } = setup()
  effects.trail(boat, boat, 1)
  assert.equal(effects.wakeIndex, 0)
  for (let i = 0; i < 100; i++) effects.hit(i, 200, i % 2 === 0)
  assert.equal(effects.hits.length, 24)
  session.state = 'paused'
  effects.update(10)
  assert.ok(effects.hits.every(hit => hit.life === .35))
  session.state = 'running'
  effects.update(1)
  assert.ok(effects.hits.every(hit => hit.life === 0))
})
