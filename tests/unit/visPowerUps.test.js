import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Avionce, playerPlane, PowerUps, PowerUp, order, powerUp, canvas2d

before(async() => {
  createPageElements()
  ;({ Avionce, playerPlane } = await import('/scenes/vis/Avionce.js'))
  ;({ default: PowerUps, PowerUp, order, powerUp } = await import('/scenes/vis/PowerUps.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

/** The vis player plane in the middle of the screen, as big as its image would make it. */
function createPlayer(t) {
  const session = new GameSession()
  session.start()
  const player = new Avionce({ session })
  player.x = 500
  player.y = 400
  player.width = player.height = 80
  t.after(() => player.end())
  return { player }
}

test('a power-up falls slowly down the screen until it is past the bottom', () => {
  const item = new PowerUp('bomb', { x: 100, y: 50 })
  item.height = 40
  item.update(1)
  assert.deepEqual([item.x, item.y], [100, 50 + powerUp.fallSpeed])
  assert.equal(item.gone, false)
  item.y = canvas2d.height + 41
  assert.equal(item.gone, true)
})

test('power-ups drop in their order, the player picks up the one it touches, and one past the bottom is gone', t => {
  const { player } = createPlayer(t)
  const scene = { children: [], add(...items) {
    this.children.push(...items)
  }, remove(...items) {
    this.children = this.children.filter(item => !items.includes(item))
  } }
  const powerUps = new PowerUps({ scene, player })

  order.forEach(() => powerUps.drop({ x: 100, y: 100 }))
  powerUps.drop({ x: player.x, y: player.y })
  powerUps.items.forEach(item => {
    item.width = item.height = 40
  })
  assert.deepEqual(powerUps.items.map(item => item.kind), [...order, order[0]], 'round and round')

  const { bombs } = player
  powerUps.update()
  assert.equal(powerUps.items.length, order.length, 'the touched one is picked up')
  assert.equal(player.fireLevel, 1, `the first is ${order[0]}`)
  assert.equal(scene.children.length, order.length)

  player.powerUp('bomb')
  player.powerUp('life')
  assert.equal(player.bombs, bombs + 1)
  assert.equal(player.zivoti, playerPlane.lives + 1)

  powerUps.items.forEach(item => {
    item.y = canvas2d.height + 200
  })
  powerUps.update()
  assert.deepEqual(scene.children, [])
})
