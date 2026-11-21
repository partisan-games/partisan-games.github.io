import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let PowerUps, PowerUp, order, powerUp, canvas2d

before(async() => {
  createPageElements()
  ;({ default: PowerUps, PowerUp, order, powerUp } = await import('/scenes/vis/PowerUps.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

test('a power-up falls slowly down the screen until it is past the bottom', () => {
  const item = new PowerUp('bomb', { x: 100, y: 50 })
  item.height = 40
  item.update(1)
  assert.deepEqual([item.x, item.y], [100, 50 + powerUp.fallSpeed])
  assert.equal(item.gone, false)
  item.y = canvas2d.height + 41
  assert.equal(item.gone, true)
})

test('power-ups drop in their order, the player picks up the one it touches, and one past the bottom is gone', () => {
  const picked = []
  const touching = { x: 500, y: 400 }
  const scene = {
    children: [],
    add(...items) {
      this.children.push(...items)
    },
    remove(...items) {
      this.children = this.children.filter(item => !items.includes(item))
    },
    touches: item => item.x === touching.x && item.y === touching.y,
    powerUp: kind => picked.push(kind),
  }
  const powerUps = new PowerUps({ scene, player: { alive: true } })
  order.forEach(() => powerUps.drop({ x: 100, y: 100 }))
  powerUps.drop(touching)
  assert.deepEqual(powerUps.items.map(item => item.kind), [...order, order[0]], 'round and round')
  powerUps.update()
  assert.deepEqual(picked, [order[0]], 'the touched one is picked up')
  assert.equal(scene.children.length, order.length)
  powerUps.items[0].height = 40 // the image does not load in tests
  powerUps.items[0].y = canvas2d.height + 1000
  powerUps.update()
  assert.equal(scene.children.length, order.length - 1, 'one past the bottom is gone')
})
