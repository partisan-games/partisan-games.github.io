import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

before(() => createPageElements())

test('the bunker gun fires five rounds after its wait, then waits for the next burst', async() => {
  const { default: Gunner } = await import('/scenes/bunker/Mitraljezac.js')
  const { default: GameObject2D } = await import('/core/actor/GameObject2D.js')
  const session = new GameSession()
  session.start()
  const target = new GameObject2D(null, { x: 500, y: 300 })
  const gunner = new Gunner(100, 100, target, session)
  session.update(2.9)
  gunner.update(0)
  assert.equal(gunner.bullets.projectiles.length, 0)
  session.update(.11)
  gunner.update(0)
  for (let i = 0; i < 4; i++) {
    session.update(.101)
    gunner.update(0)
  }
  assert.equal(gunner.bullets.projectiles.length, 5)
  session.update(2.9)
  gunner.update(0)
  assert.equal(gunner.bullets.projectiles.length, 5)
  session.update(.11)
  gunner.update(0)
  assert.equal(gunner.bullets.projectiles.length, 6)
  session.finish()
  session.update(100)
  gunner.update(0)
  assert.equal(gunner.bullets.projectiles.length, 6)
})

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

test('the patrol and direction arrow use supplied game time rather than wall time', async t => {
  const { default: Patrola } = await import('/scenes/ranjenik/Patrola.js')
  const { default: Strelica } = await import('/scenes/ranjenik/Strelica.js')
  const patrol = new Patrola()
  t.after(() => patrol.end())
  let calls = 0
  t.mock.method(patrol, 'pustiNasumicno', () => calls++)
  t.mock.timers.enable({ apis: ['Date'], now: 0 })
  const arrow = new Strelica()
  t.mock.timers.tick(100_000)
  arrow.update(0)
  patrol.update(0)
  assert.equal(arrow.vidljiva, false)
  assert.equal(calls, 0)
  arrow.update(3)
  assert.equal(arrow.vidljiva, true)
  arrow.update(.5)
  assert.equal(arrow.vidljiva, false)
  patrol.update(8)
  assert.equal(calls, 1)
})

test('neretva aiming waits for game updates and its health cannot fall below zero', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const [soldier] = scene.sveSvabe
  for (const enemy of scene.sveSvabe) enemy.ucestalost = 0
  soldier.ustani()
  scene.update(2)
  assert.equal(soldier.jeSpreman(), false)
  assert.equal(scene.energija, 100)
  scene.update(.51)
  assert.equal(soldier.jeSpreman(), true)
  assert.ok(scene.energija < 100)
  scene.nanesiStetu(1000, 1)
  assert.equal(scene.energija, 0)
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
