import { test, before } from 'node:test'
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
