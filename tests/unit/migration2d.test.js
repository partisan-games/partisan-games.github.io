import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

before(() => createPageElements())

test('a clock-bound shell waits in pause and reset cancels its old hit before reuse', async() => {
  const { default: Shell } = await import('/core/actor/projectiles/Shell.js')
  const session = new GameSession()
  session.start()
  const grenade = new Shell({ clock: session.clock })
  let hits = 0
  grenade.hit = () => hits++
  const target = { collidesWith: () => true }
  grenade.checkHit(target)
  session.update(.1)
  session.pause()
  session.update(100)
  assert.equal(hits, 0)
  grenade.reset()
  session.resume()
  session.update(1)
  assert.equal(hits, 0)
  grenade.checkHit(target)
  session.update(.151)
  assert.equal(hits, 1)
  grenade.reset()
  grenade.checkHit(target)
  session.finish()
  session.update(100)
  assert.equal(hits, 1)
})

test('the direction arrow uses supplied game time rather than wall time', async t => {
  const { default: Strelica } = await import('/scenes/ranjenik/Strelica.js')
  t.mock.timers.enable({ apis: ['Date'], now: 0 })
  const arrow = new Strelica()
  t.mock.timers.tick(100_000)
  arrow.update(0)
  assert.equal(arrow.vidljiva, false)
  arrow.update(3)
  assert.equal(arrow.vidljiva, true)
  arrow.update(.5)
  assert.equal(arrow.vidljiva, false)
})

test('neretva aiming waits for game updates and its health cannot fall below zero', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const [soldier] = scene.sveSvabe
  for (const rovovi of scene.ucestalost.keys()) scene.ucestalost.set(rovovi, 0)
  soldier.setState('aim')
  scene.update(2)
  assert.equal(soldier.state, 'aim')
  assert.equal(scene.energija, 100)
  scene.update(.51)
  assert.equal(soldier.state, 'fire')
  assert.ok(scene.energija < 100)
  scene.nanesiStetu(1000, 1)
  assert.equal(scene.energija, 0)
})

test('neretva raises hidden soldiers now and then, and twice as often in the last minute', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  t.mock.method(Math, 'random', () => .012)
  scene.update(.5)
  assert.ok(scene.daljiRovovi.every(soldier => soldier.state === 'hidden'), 'the far row rises less often')
  assert.ok(scene.bliziRovovi.every(soldier => soldier.state === 'aim'))
  scene.preostaloVreme = 59
  scene.update(.5)
  scene.update(.5)
  assert.ok(scene.daljiRovovi.every(soldier => soldier.state === 'aim'))
})

test('all remaining 2D scenes can initialize, pause, finish and be replaced without model loads', async t => {
  // The tank's async asset preparation and full replay flow are covered by tankLevelFlow.test.js.
  const names = ['bunker', 'camac', 'franjo-kluz', 'neretva', 'otpisani', 'ranjenik', 'ustanak']
  for (const name of names)
    await t.test(name, async() => {
      const { default: Scene } = await import(`/scenes/${name}/Main.js`)
      const scene = new Scene({})
      scene.init()
      scene.clear = () => {}
      scene.session.start()
      scene.session.update(.01)
      scene.update(.01, .01)
      scene.session.pause()
      const pausedAt = scene.session.clock.now
      scene.session.update(100)
      assert.equal(scene.session.clock.now, pausedAt)
      scene.session.resume()
      scene.session.finish()
      scene.end()
      assert.equal(scene.session.state, 'disposed')
      const replay = new Scene({})
      replay.init()
      replay.clear = () => {}
      assert.equal(replay.session.clock.now, 0)
      replay.end()
    })
})
