import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Svabo, trench, mouse

before(async() => {
  createPageElements()
  ;({ default: Svabo, trench } = await import('/scenes/neretva/Svabo.js'))
  mouse = (await import('/core/io/mouse.js')).default
})

/** A soldier alone in his trench, counting the damage of each frame he fires. */
function soldierAlone() {
  const strikes = []
  const soldier = new Svabo({ scale: 1, callback: (damage, dt) => strikes.push(damage * dt) })
  const live = seconds => {
    for (let i = 0; i < Math.round(seconds * 30); i++) soldier.update(1 / 30)
  }
  return { soldier, strikes, live }
}

test('a trench soldier has the states hidden, aim, fire and fall, and stays hidden until set to another', () => {
  const { soldier, strikes, live } = soldierAlone()
  assert.deepEqual(soldier.states, ['hidden', 'aim', 'fire', 'fall'])
  live(60)
  assert.equal(soldier.state, 'hidden')
  assert.equal(strikes.length, 0)
})

test('a risen soldier aims for his while, then fires every frame until he falls', () => {
  const { soldier, strikes, live } = soldierAlone()
  soldier.setState('aim')
  live(trench.aimTime - .1)
  assert.equal(soldier.state, 'aim')
  assert.equal(strikes.length, 0)
  live(.2)
  assert.equal(soldier.state, 'fire')
  const fired = strikes.length
  assert.ok(fired > 0, 'he fires in the frame he is ready')
  live(1)
  assert.equal(strikes.length, fired + 30)
  assert.ok(Math.abs(strikes.at(-1) - trench.damage / 30) < 1e-9)
})

test('a soldier can be hit only while he stands, and falls back into his trench', t => {
  const { soldier, strikes, live } = soldierAlone()
  t.mock.method(mouse, 'isOver', () => true)
  assert.equal(soldier.jePogodjen(), false, 'hidden')
  soldier.setState('fire')
  assert.equal(soldier.jePogodjen(), true)
  soldier.setState('fall')
  assert.equal(soldier.jePogodjen(), false)
  const fired = strikes.length
  live(1)
  assert.equal(soldier.state, 'fall')
  live(.3)
  assert.equal(soldier.state, 'hidden', 'he lies in the trench again')
  assert.equal(strikes.length, fired)
})
