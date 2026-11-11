import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'
import { captureScreens } from './helpers/screens.js'

// recorded from the screens as they were before they became event driven
const recorded = JSON.parse(readFileSync(new URL('./fixtures/screens.json', import.meta.url)))

let Scena

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
})

for (const style of Object.keys(recorded))
  test(`start, pause, defeat and victory screens keep their HTML and order in the ${style} style`, async() => {
    assert.deepEqual(await captureScreens(style), recorded[style])
  })

const modal = () => document.getElementById('modal')
const message = () => document.querySelector('div.message')
const createScene = () => new Scena({ canvas: document.createElement('canvas'), intro: 'Reach the forest' })

test('the scene UI drawn every frame leaves the central screen alone', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  scene.sceneUI = () => '<div class="top-left">Score: 1</div>'
  scene.start()
  scene.pause()
  const pauseScreen = modal().firstElementChild

  scene.ui.render(0)

  assert.equal(modal().firstElementChild, pauseScreen)
  assert.match(document.getElementById('ui').innerHTML, /Score: 1/)
  frames.step()
  scene.end()
})

test('a message waits behind the pause menu and is still there after continuing', () => {
  installFakeFrames()
  const scene = createScene()
  scene.start()
  scene.ui.showMessage('Destroy the factories')

  scene.pause()
  assert.match(modal().textContent, /Game paused/)
  assert.equal(message().hidden, true)

  scene.unpause()
  assert.equal(modal().innerHTML, '')
  assert.equal(message().hidden, false)
  assert.match(message().textContent, /Destroy the factories/)
  scene.end()
})

test('an older message timer does not remove a newer message', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  installFakeFrames()
  const scene = createScene()
  scene.start()

  scene.ui.showMessage('first')
  t.mock.timers.tick(2000)
  scene.ui.showMessage('second')
  t.mock.timers.tick(1000)

  assert.match(message().textContent, /second/)
  t.mock.timers.tick(2000)
  assert.equal(message().textContent.trim(), '')
  scene.end()
})

test('the message element goes away with the game', () => {
  const scene = createScene()
  scene.end()

  assert.equal(message(), null)
})

test('leaving the tab on the start screen keeps the start screen', () => {
  installFakeFrames()
  const scene = createScene()
  scene.ui.renderStartScreen()

  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

  assert.ok(modal().querySelector('#start'))
  assert.doesNotMatch(modal().textContent, /Game paused/)
  scene.end()
})
