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

test('automatic starts and synthetic clicks leave audio locked; trusted input unlocks it', t => {
  installFakeFrames()
  const scene = createScene()
  t.after(() => scene.end())
  let unlocks = 0
  scene.sceneAudio.unlock = async() => {
    unlocks++
  }
  scene.start()
  scene.pause()
  scene.unpause()
  assert.equal(unlocks, 0)
  document.dispatchEvent(new Event('click'))
  assert.equal(unlocks, 0, 'synthetic clicks are not user activation')
  scene.unlockAudio({ isTrusted: true })
  assert.equal(unlocks, 1)
})

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

test('Esc on a decorative scene does not open a pause menu that the decorative scene could never leave', t => {
  const frames = installFakeFrames()
  const decoration = new Scene({ canvas: document.createElement('canvas'), disableEvents: true })
  t.after(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape' }))
    decoration.end()
  })
  decoration.start()
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }))
  frames.step()
  assert.equal(decoration.ui.screen, null)
  assert.equal(decoration.gameLoop.isRunning, true)
  assert.equal(document.getElementById('modal').textContent.includes('Game paused'), false)
})

test('audio transitions advance with simulated time instead of dropped fixed-step frame time', t => {
  const frames = installFakeFrames()
  const scene = new Scene({ canvas: document.createElement('canvas'), fixedStep: true, disableEvents: true })
  t.after(() => scene.end())
  const elapsed = []
  t.mock.method(scene.sceneAudio, 'update', dt => elapsed.push(dt))
  scene.start()
  frames.step()
  frames.step(2000)
  assert.ok(elapsed.at(-1) > 0)
  assert.ok(elapsed.at(-1) < .1, 'dropped time cannot finish an audio transition instantly')
  assert.equal(elapsed.at(-1), scene.session.presentationClock.now)
  scene.pause()
  const count = elapsed.length
  frames.step(2000)
  assert.equal(elapsed.length, count)
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

test('first drawing waits for the wreck of an object destroyed from the start', async t => {
  const { wreckFor } = await import('/core/actor/wreckView.js')
  // a picture that loads only when the test says so
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.defineProperty(globalThis, 'Image', { value: class extends EventTarget {
    complete = false
  }, configurable: true, writable: true })
  t.after(() => Object.defineProperty(globalThis, 'Image', descriptor))
  const scene = createScene()
  const src = '/assets/images/buildings/kuca-bunker.png'
  scene.add({ image: { complete: true, naturalWidth: 1, src }, dead: true })
  const wreck = wreckFor(src)
  let ready = false
  const loading = scene.imagesLoaded().then(() => {
    ready = true
  })
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  assert.equal(ready, false, 'not before the wreck')
  wreck.dispatchEvent(new Event('load'))
  await loading
  assert.equal(ready, true)
  scene.end()
})

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

test('the start and continue buttons act on the live scene only, not on one that has ended', async t => {
  installFakeFrames()
  const ended = createScene()
  const endedStart = t.mock.method(ended, 'start')
  ended.end()
  const scene = createScene()
  t.after(() => scene.end())
  const start = t.mock.method(scene, 'start')

  scene.session.ready()
  scene.ui.renderStartScreen()
  document.getElementById('start').click()
  await new Promise(resolve => {
    setTimeout(resolve)
  }) // the start is paid for before it starts
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

test('world input is ignored while loading, paused, covered by a modal or finished', t => {
  const scene = createScene()
  t.after(() => scene.end())
  const input = t.mock.method(scene.world, 'handleInput')
  scene.handleInput(1 / 60)
  scene.session.ready()
  scene.handleInput(1 / 60)
  scene.session.start()
  scene.ui.showPauseScreen()
  scene.handleInput(1 / 60)
  scene.ui.hideScreen()
  scene.session.pause()
  scene.handleInput(1 / 60)
  scene.session.resume()
  scene.session.finish()
  scene.handleInput(1 / 60)
  assert.equal(input.mock.callCount(), 0)
})

test('a ready scene still receives its custom start choice', t => {
  installFakeFrames()
  class ChoiceScene extends Scene {
    handleClick(event) {
      if (event.target.id === 'choice') this.start()
    }
  }
  const scene = new ChoiceScene({ canvas: document.createElement('canvas'), customStartScreen: () => '<button id="choice">Choose</button>' })
  t.after(() => scene.end())
  scene.session.ready()
  scene.ui.renderStartScreen()
  document.getElementById('choice').click()
  assert.equal(scene.session.state, 'running')
  assert.equal(scene.ui.screen, null)
})

test('a game that locks the mouse does not lock it when started by touch, locks it on a mouse click, and pauses on a hidden page', t => {
  installFakeFrames()
  const setVisibility = value => Object.defineProperty(document, 'visibilityState', { value, configurable: true })
  t.after(() => setVisibility('visible'))
  const lock = t.mock.fn()
  document.body.requestPointerLock = lock
  t.after(() => delete document.body.requestPointerLock)
  const scene = new Scene({ canvas: document.createElement('canvas'), usePointerLock: true })
  t.after(() => scene.end())
  const press = pointerType => scene.canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType }))
  document.body.append(scene.canvas)
  press('touch')
  scene.start()
  assert.equal(lock.mock.callCount(), 0)
  press('mouse')
  assert.equal(lock.mock.callCount(), 1)
  setVisibility('hidden')
  document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(scene.ui.screen, 'pause')
})
