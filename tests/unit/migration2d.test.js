import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

before(() => createPageElements())

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
  assert.equal(soldier.state, 'attack')
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
  assert.ok(scene.daljiRovovi.every(({ body }) => body.state === 'idle'), 'the far row rises less often')
  assert.ok(scene.bliziRovovi.every(({ body }) => body.state === 'aim'))
  scene.preostaloVreme = 59
  scene.update(.5)
  scene.update(.5)
  assert.ok(scene.daljiRovovi.every(({ body }) => body.state === 'aim'))
})

test('neretva replaces a fallen defender only after his collapse and reuses his cover and view', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const { trench } = await import('/core/gameplay/bodies/soldiers/TrenchSoldier.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  for (const row of scene.ucestalost.keys()) scene.ucestalost.set(row, 0)
  const [post] = scene.sveSvabe
  const { body, cover, view } = post
  body.setState('dead')
  body.update(trench.fallTime / 2)
  scene.podizi(0)
  assert.equal(post.body, body)
  body.update(trench.fallTime / 2)
  scene.podizi(0)
  assert.ok(body.dead && !scene.children.includes(body))
  assert.equal(post.body.state, 'idle')
  assert.equal(post.view.body, post.body)
  assert.deepEqual([post.body.x, post.body.y], [body.x, body.y])
  assert.ok(scene.children.indexOf(cover) > scene.children.indexOf(view))
})

test('neretva owns separate trench covers, keeps its shot window and replaces the whole formation together', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const original = [...scene.sveSvabe]
  const draws = []
  const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    drawImage(...args) {
      draws.push({ args, smooth: this.imageSmoothingEnabled })
    } }
  for (const { body, view, cover } of original) {
    loadAtlas(cover, 100, 150)
    assert.ok(cover.image.src.endsWith('/armies/rov-prazan.gif'))
    assert.ok(scene.children.indexOf(cover) > scene.children.indexOf(view), 'cover is drawn in front of the figure')
    const { scale } = view
    assert.equal(view.y, cover.y - 24 * scale)
    assert.deepEqual([cover.width, cover.height], [100 * scale, 150 * scale])
    cover.render(ctx)
    assert.equal(draws.at(-1).smooth, false, 'far and near trenches keep the original pixel sampling')
    assert.equal(draws.at(-1).args[0], cover.image)
    body.setState('aim')
    scene.proveriPogotke([{ body, view, cover }], { x: cover.x + 45 * scale, y: cover.y })
    assert.equal(body.state, 'dead', 'the existing trench shot window is preserved')
  }
  scene.preostaloVreme = 59
  scene.bringChetniks()
  for (const { body, view, cover } of original)
    assert.ok(!scene.children.includes(body) && !scene.children.includes(view) && !scene.children.includes(cover))
  for (const { body, view, cover } of scene.sveSvabe)
    assert.ok(scene.children.includes(body) && scene.children.includes(view) && scene.children.includes(cover))
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
  assert.ok(scene.background.image.src.endsWith('/neretva-1943-nemci.png'))
  scene.preostaloVreme = 60.5
  scene.update(1)
  assert.deepEqual([...factions()], ['cetnici'])
  assert.ok(scene.background.image.src.endsWith('/neretva-1943-cetnici.png'))
  assert.equal(scene.ui.showMessage.mock.calls[0].arguments[0], 'Chetniks are next')
  assert.ok(!scene.ui.outro, 'not won yet')
  scene.update(1)
  assert.equal(scene.ui.showMessage.mock.callCount(), 1, 'the Chetniks come once')
  t.mock.method(scene, 'victory')
  scene.preostaloVreme = 0
  scene.update(.01)
  assert.equal(scene.victory.mock.callCount(), 1)
})

test('all remaining 2D scenes can initialize, pause, finish and be replaced without model loads', async t => {
  // The tank's async asset preparation and full replay flow are covered by tankLevelFlow.test.js.
  const names = ['bunker', 'camac', 'franjo-kluz', 'neretva', 'otpisani', 'ustanak']
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

test('neretva trenches lie in groups, not evenly, and a click on the lower half of a far trench still hits its soldier', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const scene = new Neretva()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const gaps = scene.bliziRovovi.slice(1).map(({ cover }, i) => Math.round(cover.x - scene.bliziRovovi[i].cover.x))
  assert.ok(new Set(gaps).size > 1, `gaps ${gaps}`)
  for (const rovovi of scene.ucestalost.keys()) scene.ucestalost.set(rovovi, 0)
  const [post] = scene.daljiRovovi
  // the trench picture does not load here; its opening is the shot window
  for (const { cover } of scene.sveSvabe) Object.assign(cover, { width: 30, height: 20 })
  post.body.setState('aim')
  scene.session.ready()
  scene.session.start()
  scene.handleClick({ target: scene.canvas, pageX: post.cover.x, pageY: post.cover.y + 8 })
  assert.equal(post.body.state, 'dead')
})
