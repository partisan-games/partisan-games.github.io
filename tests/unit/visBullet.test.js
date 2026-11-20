import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Bullet

before(async() => {
  createPageElements()
  Bullet = (await import('/scenes/vis/Bullet.js')).default
})

test('a bullet is heard as it leaves the gun and flies on where it was fired until it leaves the screen', t => {
  const bullet = new Bullet()
  bullet.width = bullet.height = 8 // as its image would give
  const played = []
  t.mock.method(bullet.sound, 'play', () => played.push(bullet.position))
  bullet.launch({ x: 200, y: 300 }, Math.PI * 1.5, 100)
  assert.equal(played.length, 1)
  bullet.update(1)
  assert.ok(Math.abs(bullet.x - 200) < 1e-9 && Math.abs(bullet.y - 200) < 1e-9)
  bullet.update(5)
  assert.equal(bullet.visible, false, 'gone above the screen')
})
