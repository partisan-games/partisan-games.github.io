import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'

let Tenkici, TankKeys, TankAI, keys

before(async() => {
  createPageElements()
  const layout = JSON.parse(readFileSync(new URL('../../assets/images/background/batina-1944/layout.json', import.meta.url), 'utf8'))
  mock.method(globalThis, 'fetch', async() => ({ ok: true, json: async() => layout }))
  const { installFakeFrames } = await import('./helpers/frames.js')
  installFakeFrames()
  ;({ default: Tenkici } = await import('/scenes/tenkici/Main.js'))
  ;({ default: TankKeys } = await import('/core/gameplay/controllers/TankKeys.js'))
  ;({ default: TankAI } = await import('/core/gameplay/controllers/TankAI.js'))
  keys = await import('/core/io/keys.js')
})

function scene(t) {
  const game = new Tenkici()
  game.init()
  game.clear = () => {} // happy-dom has no 2D canvas to draw the background on
  t.after(() => game.end())
  return game
}

test('one player drives the left tank with the left keys against a tank that drives itself; two players get a tank each', async t => {
  const game = scene(t)
  const driving = body => game.controllers.filter(controller => controller.body === body)
  assert.equal(driving(game.tenk).length, 1)
  assert.ok(driving(game.tenk)[0] instanceof TankKeys)
  assert.equal(driving(game.tenk)[0].keys, keys.leftPlayerKeys)
  assert.ok(driving(game.tenk2)[0] instanceof TankAI)

  await game.prepare('dva-igraca')
  assert.equal(driving(game.tenk2).length, 1, 'the keys replace the AI')
  assert.ok(driving(game.tenk2)[0] instanceof TankKeys)
  assert.equal(driving(game.tenk2)[0].keys, keys.rightPlayerKeys)
})

test('a match goes to two won rounds, each on the next battlefield; both lost at once count for the left tank', t => {
  const game = scene(t)
  game.start()
  const first = game.battlefield
  game.tenk.setState('dead')
  game.tenk2.setState('dead')
  game.update(0)
  assert.deepEqual(game.score, [1, 0])
  assert.equal(game.ui.screen, 'round')
  assert.match(document.getElementById('modal').textContent, /Round 1: Partisan tank wins/)

  game.nextRound()
  assert.equal(game.ui.screen, null)
  assert.notEqual(game.battlefield, first, 'the next round is on the next battlefield')
  assert.equal(game.tenk.alive && game.tenk2.alive, true, 'two whole tanks')
  assert.equal(game.controllers.length, 2)
  game.tenk2.setState('dead')
  game.update(0)
  assert.match(document.getElementById('modal').textContent, /German tank destroyed\. 2 : 0/)
})

test('each new match goes on to the next battlefield, starting over after the last', async() => {
  const { default: Tenkici, battlefieldOrder, fieldLength } = await import('/scenes/tenkici/Main.js')
  const { germanTank, m15, stug, somuaTank, hotchkiss } = await import('/core/actor/tankLooks.js')
  const looks = { sremFront1944: m15, batina: stug, sremFront1945: m15, city: germanTank,
    bihac: germanTank, drvar: somuaTank, uzice: hotchkiss }
  const seen = []
  for (let i = 0; i <= battlefieldOrder.length; i++) {
    const scene = new Tenkici()
    scene.init()
    seen.push(scene.battlefield)
    const enemy = looks[scene.battlefield]
    assert.equal(scene.tenk2.kind, enemy.kind)
    assert.equal(scene.tenk2View.art, enemy.art)
    assert.equal(scene.tenk2.rearAim, enemy !== stug, 'only a turret can turn behind the hull')
    assert.match(scene.tenkView.art.src, /partizanski-tenk-layers\.png$/)
    for (const [tank, left, right] of [[scene.tenk, 0, fieldLength / 2], [scene.tenk2, fieldLength / 2, fieldLength]]) {
      const radius = tank.size.length / 2
      assert.ok(tank.x >= tank.bounds.min && tank.x <= tank.bounds.max)
      assert.equal(tank.bounds.min, left + radius)
      assert.equal(tank.bounds.max, right - radius)
    }
    scene.end()
  }
  const first = battlefieldOrder.indexOf(seen[0])
  assert.deepEqual(seen, seen.map((_, i) => battlefieldOrder[(first + i) % battlefieldOrder.length]))
  assert.equal(seen.at(-1), seen[0], 'after the last it starts over')
})
