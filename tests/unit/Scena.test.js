import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'

let Scena

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
})

const createScene = () => new Scena({ canvas: document.createElement('canvas') })
const createObject = () => ({ ended: 0, end() {
  this.ended++
} })

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
const clickButton = id => {
  const button = document.createElement('button')
  button.id = id
  document.body.appendChild(button)
  button.click()
  button.remove()
}

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

test('play again from the pause menu resets the scene and continues the game', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  let resets = 0
  scene.reset = () => resets++
  scene.start()
  frames.step()
  scene.pause()

  clickButton('igraj-opet')
  frames.step()

  assert.equal(resets, 1)
  assert.equal(scene.gameLoop.isPaused, false)
  assert.equal(modal(), '')
  scene.end()
})

test('play again after the end clears the end screen and restarts game time', () => {
  const frames = installFakeFrames()
  const scene = createScene()
  scene.reset = () => {}
  scene.start()
  frames.step()
  scene.victory('won')
  frames.step()
  assert.match(modal(), /won/)

  clickButton('igraj-opet')
  frames.step()

  assert.equal(scene.ui.outro, '')
  assert.equal(scene.gameLoop.timeStopped, false)
  assert.equal(modal(), '')
  scene.end()
})

test('play again without a reset method reloads the page', () => {
  installFakeFrames()
  const reload = mock.method(location, 'reload', () => {})
  const scene = createScene()

  clickButton('igraj-opet')

  assert.equal(reload.mock.callCount(), 1)
  reload.mock.restore()
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
