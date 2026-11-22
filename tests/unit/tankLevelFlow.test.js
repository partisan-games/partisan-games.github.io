import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'
import Health from '/core/gameplay/Health.js'

test('the complete level keeps scrolling through its stages, ground combat, aircraft passes, pause and the finish, the tank in front', async t => {
  createPageElements()
  const draws = []
  const ctx = { createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {},
    drawImage(...args) {
      draws.push(args)
    }, save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, fill() {}, stroke() {}, ellipse() {} }
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ctx)
  // asset stand-ins let the real scene finish init without a browser or actual rasterization
  loadImages(t, { '/items/granata.gif': [32, 8], '/plamen.gif': [75, 98], '-1945.png': [1536, 1024] })
  const Scene = (await import('/scenes/to-trieste/Main.js')).default
  const scene = new Scene()
  t.after(() => scene.end())
  await scene.init()
  t.mock.method(scene.ui, 'showMessage', () => {})
  // isolate the road's progress from survival skill; weapons and health have their own checks
  scene.player.health = new Health({ maximum: 1_000_000 })
  scene.session.ready()
  scene.session.start()
  const planes = new Set()
  let shots = 0, paused = false, road
  const stagesSeen = []
  const step = 1 / 60
  for (let frame = 0; frame < 12_000 && scene.session.state === 'running'; frame++) {
    if (!paused && scene.cameraX > scene.levelLength / 3) {
      const { cameraX } = scene, { now } = scene.session.clock
      scene.session.pause()
      scene.session.update(2)
      scene.update(2)
      assert.equal(scene.cameraX, cameraX)
      assert.equal(scene.session.clock.now, now)
      scene.session.resume()
      paused = true
    }
    if (frame % 72 === 0 && scene.player.shoot()) shots++
    const before = scene.cameraX
    scene.session.update(step)
    scene.update(step)
    assert.ok(scene.cameraX > before, 'air raids and combat must not stop the road')
    if (frame % 120 === 0) {
      draws.length = 0
      scene.route.render()
      // the road is the part of a stage's picture below its top rows
      const current = draws.filter(draw => draw[2] > 0).map(draw => draw[5]).join()
      if (road !== undefined) assert.notEqual(current, road, 'the drawn road moves during ground and air combat')
      road = current
    }
    const { id } = scene.route.stageAt(scene.cameraX)
    if (stagesSeen.at(-1) !== id) stagesSeen.push(id)
    // the renderer draws a lower layer later, in front
    assert.ok(scene.hostiles.every(({ view }) => view.position.z > scene.playerView.position.z), 'the tank passes in front of the enemies')
    const flying = scene.hostiles.filter(hostile => hostile.sort === 'plane')
    assert.ok(flying.length <= 1, 'one air raid at a time')
    flying.forEach(hostile => planes.add(hostile))
  }
  assert.ok(paused && shots > 100 && planes.size >= 4, `${paused} ${shots} ${planes.size}`)
  assert.equal(scene.cameraX, scene.levelLength)
  for (const { body, view } of scene.escort.soldiers) {
    assert.ok(body.shotsFired > 0, body.role + ': supporting fire during the crossing')
    assert.ok(view.sheet.art.src.includes('partisan-'), 'the level uses the shared prepared partisan art')
    if (body.role === 'runner') assert.ok(Math.abs(body.x - scene.player.x) < 10, 'the runners keep up with the tank')
  }
  assert.deepEqual(stagesSeen, ['lika', 'senj', 'rijeka', 'trst'], 'the road runs through its stages in order, to Trieste')
  assert.equal(scene.session.state, 'finished')
  assert.match(scene.ui.outro, /Proboj je uspeo/)
  scene.end()
  const replay = new Scene()
  t.after(() => replay.end())
  await replay.init()
  assert.equal(replay.cameraX, 0)
  assert.equal(replay.session.clock.now, 0)
  assert.ok(replay.hostiles.every(hostile => hostile.sort !== 'plane'))
})
