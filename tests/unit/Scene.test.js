import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'

let Scene

before(async() => {
  createPageElements()
  Scene = (await import('/core/Scene.js')).default
})

const createScene = () => new Scene({ canvas: document.createElement('canvas') })

test('starting and continuing focus the game, while a decorative scene leaves focus alone', t => {
  installFakeFrames()
  const scene = createScene()
  const decoration = new Scene({ canvas: document.createElement('canvas'), disableEvents: true })
  document.body.append(scene.canvas, decoration.canvas)
  t.after(() => {
    scene.end()
    decoration.end()
    scene.canvas.remove()
    decoration.canvas.remove()
  })
  scene.ui.renderStartScreen()
  document.getElementById('start').focus()
  scene.start()
  assert.equal(document.activeElement, scene.canvas)
  scene.pause()
  document.getElementById('continue').focus()
  scene.unpause()
  assert.equal(document.activeElement, scene.canvas)
  decoration.start()
  assert.equal(document.activeElement, scene.canvas)
  assert.equal(decoration.canvas.hasAttribute('tabindex'), false)
})

test('cached images still wait for object dimensions and load callbacks', async() => {
  const scene = createScene()
  let finishLoading
  const imageLoaded = new Promise(resolve => {
    finishLoading = resolve
  })
  scene.add({ image: { complete: true }, imageLoaded })
  let ready = false
  const loaded = scene.imagesLoaded().then(() => {
    ready = true
  })
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(ready, false)
  finishLoading()
  await loaded
  assert.equal(ready, true)
  scene.end()
})

test('initial drawing waits for nested images as well as the tank body', async() => {
  const scene = createScene()
  const body = new EventTarget()
  const barrel = new EventTarget()
  body.complete = false
  barrel.complete = false
  scene.add({ image: body, children: [{ children: [{ image: barrel }] }] })
  let ready = false
  const loaded = scene.imagesLoaded().then(() => {
    ready = true
  })

  body.dispatchEvent(new Event('load'))
  await Promise.resolve()
  assert.equal(ready, false)
  barrel.dispatchEvent(new Event('load'))
  await loaded
  assert.equal(ready, true)
  scene.end()
})
const createObject = () => ({ ended: 0, end() {
  this.ended++
} })

test('first drawing waits for a background, a separate player and image decoding', async() => {
  const scene = createScene()
  const background = Object.assign(new EventTarget(), { complete: false })
  let finishDecode
  const decoded = new Promise(resolve => {
    finishDecode = resolve
  })
  scene.background = { image: background }
  scene.player = { image: { complete: true, decode: () => decoded } }
  let ready = false
  const loading = scene.imagesLoaded().then(() => {
    ready = true
  })
  background.dispatchEvent(new Event('load'))
  await Promise.resolve()
  assert.equal(ready, false)
  finishDecode()
  await loading
  assert.equal(ready, true)
  scene.end()
})

test('an image failure rejects readiness instead of leaving the loading screen stuck', async() => {
  const scene = createScene()
  const image = Object.assign(new EventTarget(), { complete: false })
  scene.add({ image, imageLoaded: new Promise(() => {}) })
  const loading = scene.imagesLoaded()
  image.dispatchEvent(new Event('error'))
  await assert.rejects(loading, /Image could not be loaded/)
  scene.end()
})

test('end ends every scene object, including a player kept outside the scene list', () => {
  const scene = createScene()
  const inList = createObject()
  const player = createObject()
  scene.add(inList, {})
  scene.player = player

  scene.end()

  assert.equal(inList.ended, 1)
  assert.equal(player.ended, 1)
})

test('end ends a player that is also in the scene list only once', () => {
  const scene = createScene()
  scene.player = createObject()
  scene.add(scene.player)

  scene.end()

  assert.equal(scene.player.ended, 1)
})

const modal = () => document.getElementById('modal').textContent

test('defeat shows the end screen on the next frame', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  scene.start()

  scene.defeat('caught')
  frames.step()

  assert.match(modal(), /Game over/)
  assert.match(modal(), /caught/)
  scene.end()
})

test('pause is ignored once the game is over', () => {
  installFakeFrames()
  const scene = createScene()
  scene.start()
  scene.defeat()

  scene.pause()

  assert.equal(scene.gameLoop.isPaused, false)
  scene.end()
})

test('the first result stands: a later victory does not replace a defeat', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  scene.start()

  scene.defeat('time is up')
  scene.victory('all gathered')
  frames.step()

  assert.match(modal(), /time is up/)
  assert.doesNotMatch(modal(), /all gathered/)
  scene.end()
})

test('the scene moves its session clock only while the game runs, and ends the session with the game', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  const fired = []
  let cleanups = 0
  scene.session.scope.add(() => cleanups++)
  scene.start()
  scene.session.gameplay.after(.05, () => fired.push('due'))

  frames.step() // the first frame only sets the start time
  frames.step(40)
  scene.pause()
  frames.step(1000)
  frames.step(1000)
  assert.deepEqual(fired, [])
  scene.unpause()
  frames.step(1000) // the first frame after a pause starts the time again
  frames.step(20)
  assert.deepEqual(fired, ['due'])

  scene.session.gameplay.after(.01, () => fired.push('after the end'))
  scene.defeat()
  frames.step(1000)
  assert.deepEqual(fired, ['due'])

  scene.end()
  assert.equal(scene.session.state, 'disposed')
  assert.equal(cleanups, 1)
})

test('a game ended late, after the next one began, leaves the next game its screen, canvas, results and timers', () => {
  installFakeFrames()
  const canvas = document.createElement('canvas')
  const old = new Scene({ canvas, intro: 'old' })
  const next = new Scene({ canvas, intro: 'next' })
  next.sceneUI = () => '<b>next score</b>'
  next.ui.renderStartScreen()
  next.ui.render(0)
  const fired = []
  next.start()
  next.session.gameplay.after(0, () => fired.push('next timer'))
  next.ui.showPauseScreen()

  old.end() // a slow init finished after the next game had started
  old.end()

  assert.match(modal(), /Paused|Continue/i)
  assert.equal(document.getElementById('ui').innerHTML, '<b>next score</b>')
  assert.equal(canvas.style.display, 'block')
  next.session.update(0)
  assert.deepEqual(fired, ['next timer'])
  next.end()
  assert.equal(canvas.style.display, 'none')
  assert.equal(modal(), '')
})

test('the start and continue buttons act on the live scene only, not on one that has ended', t => {
  installFakeFrames()
  const ended = createScene()
  const endedStart = t.mock.method(ended, 'start')
  ended.end()
  const scene = createScene()
  t.after(() => scene.end())
  const start = t.mock.method(scene, 'start')

  scene.ui.renderStartScreen()
  document.getElementById('start').click()
  assert.equal(start.mock.callCount(), 1)
  assert.equal(endedStart.mock.callCount(), 0)

  start.mock.restore()
  scene.start()
  scene.pause()
  document.getElementById('continue').click()
  assert.equal(scene.gameLoop.isPaused, false)
})

test('a hidden page pauses the running game, and an ended game no longer listens for it', t => {
  installFakeFrames()
  const setVisibility = value => Object.defineProperty(document, 'visibilityState', { value, configurable: true })
  t.after(() => setVisibility('visible'))
  const scene = createScene()
  scene.start()
  setVisibility('hidden')
  document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(scene.ui.screen, 'pause')

  const pause = t.mock.method(scene, 'pause')
  scene.end()
  document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(pause.mock.callCount(), 0)
})

test('the scene handles input of live 2D objects only; dead ones and 3D objects, which read input in their update, are skipped', () => {
  const scene = createScene()
  const calls = []
  const object = (name, fields) => ({ name, ...fields, handleInput: () => calls.push(name), update() {} })
  scene.add(object('live', { alive: true }), object('dead', { alive: false }), object('3d', { dead: false }))
  scene.handleInput(1 / 30)
  scene.end()
  assert.deepEqual(calls, ['live'])
})
