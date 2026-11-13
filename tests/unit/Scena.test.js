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

test('cached images still wait for object dimensions and load callbacks', async() => {
  const scene = createScene()
  let finishLoading
  const slikaUcitana = new Promise(resolve => { finishLoading = resolve })
  scene.add({ slika: { complete: true }, slikaUcitana })
  let ready = false
  const loaded = scene.slikeUcitane().then(() => { ready = true })
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
  scene.add({ slika: body, predmeti: [{ predmeti: [{ slika: barrel }] }] })
  let ready = false
  const loaded = scene.slikeUcitane().then(() => { ready = true })

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
  const old = new Scena({ canvas, intro: 'old' })
  const next = new Scena({ canvas, intro: 'next' })
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
