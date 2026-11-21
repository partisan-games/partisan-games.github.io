import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

before(() => createPageElements())

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
  const [{ body: soldier }] = scene.sveSvabe
  for (const rovovi of scene.ucestalost.keys()) scene.ucestalost.set(rovovi, 0)
  soldier.setState('aim')
  scene.update(2)
  assert.equal(soldier.state, 'aim')
  assert.equal(scene.energija, 100)
  scene.update(.51)
  assert.equal(soldier.state, 'fire')
  assert.ok(scene.energija < 100)
  scene.health.damage(1000)
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
  assert.ok(scene.daljiRovovi.every(({ body }) => body.state === 'hidden'), 'the far row rises less often')
  assert.ok(scene.bliziRovovi.every(({ body }) => body.state === 'aim'))
  scene.preostaloVreme = 59
  scene.update(.5)
  scene.update(.5)
  assert.ok(scene.daljiRovovi.every(({ body }) => body.state === 'aim'))
})

test('neretva: the Germans hold the trenches first, the Chetniks take over half way, and only the end wins', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const factions = () => new Set(scene.sveSvabe.map(({ view }) => view.faction))
  t.mock.method(scene.ui, 'showMessage')
  assert.deepEqual([...factions()], ['nemci'])
  scene.preostaloVreme = 60.5
  scene.update(1)
  assert.deepEqual([...factions()], ['cetnici'])
  assert.equal(scene.ui.showMessage.mock.calls[0].arguments[0], 'Chetniks are next')
  assert.ok(!scene.ui.outro, 'not won yet')
  scene.update(1)
  assert.equal(scene.ui.showMessage.mock.callCount(), 1, 'the Chetniks come once')
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
