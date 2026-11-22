import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'
import { admission } from '/core/io/admission.js'

let Scene, Scene3D, WallsScene, Arcade
before(async() => {
  createPageElements()
  Scene = (await import('/core/Scene.js')).default
  Scene3D = (await import('/core/Scene3D.js')).default
  WallsScene = (await import('/scenes/walls/Main.js')).default
  Arcade = (await import('/ui/Arcade.js')).default
})

test('a tour with an intro starts and replays without consulting an empty or unavailable wallet', async t => {
  installFakeFrames()
  const charge = t.mock.method(admission, 'charge', async() => {
    throw new Error('wallet unavailable')
  })
  const remaining = t.mock.method(admission, 'remaining', () => {
    throw new Error('wallet unavailable')
  })
  class FreeScene extends Scene {
    get free() {
      return WallsScene.prototype.free
    }
  }
  for (let i = 0; i < 2; i++) {
    const scene = new FreeScene({ canvas: document.createElement('canvas'), intro: 'Start', disableEvents: true })
    scene.session.ready()
    scene.ui.renderStartScreen()
    assert.equal(document.querySelector('#start').disabled, false)
    assert.equal(document.querySelectorAll('[data-paid], .price').length, 0)
    await scene.play(i ? scene.lastChoice : 'chosen')
    assert.equal(scene.session.state, 'running')
    assert.equal(scene.costsToken, false)
    assert.equal(scene.lastChoice, 'chosen')
    scene.defeat('Finished')
    assert.equal(document.querySelector('#igraj-opet').disabled, false)
    assert.equal(document.querySelectorAll('[data-paid], .price').length, 0)
    scene.end()
  }
  assert.equal(charge.mock.callCount(), 0)
  assert.equal(remaining.mock.callCount(), 0)
})

test('2D and 3D games retain token pricing; an empty wallet cannot start them', async t => {
  installFakeFrames()
  let left = 1
  const charge = t.mock.method(admission, 'charge', async() => left ? { day: 'today' } : null)
  t.mock.method(admission, 'remaining', () => left)
  assert.equal(Scene.prototype.free, false)
  assert.equal(Scene3D.prototype.free, false)
  const paid = new Scene({ canvas: document.createElement('canvas'), intro: 'Start', disableEvents: true })
  paid.session.ready()
  paid.ui.renderStartScreen()
  assert.equal(document.querySelectorAll('.price').length, 1)
  await paid.play()
  assert.equal(charge.mock.callCount(), 1)
  assert.equal(paid.costsToken, true)
  paid.defeat('Finished')
  assert.equal(document.querySelectorAll('#igraj-opet .price').length, 1)
  paid.end()
  left = 0
  const empty = new Scene({ canvas: document.createElement('canvas'), intro: 'Start', disableEvents: true })
  empty.session.ready()
  empty.ui.renderStartScreen()
  assert.equal(document.querySelector('#start').disabled, true)
  await empty.play()
  assert.equal(empty.session.state, 'ready')
  empty.end()
})

test('scene and animation cards say VIEW without a coin; game cards keep their coin slots', async t => {
  const container = document.createElement('div')
  container.innerHTML = '<div data-free><div class="menu-item" data-path="free"><h3>Free</h3><img></div></div><div class="menu-item" data-path="paid"><h3>Paid</h3><img></div>'
  document.body.append(container)
  const arcade = new Arcade()
  t.after(() => {
    arcade.dispose(); container.remove()
  })
  const free = container.querySelector('[data-path="free"]')
  const paid = container.querySelector('[data-path="paid"]')
  assert.equal(free.querySelector('.arcade-slot-label').textContent, 'VIEW')
  assert.equal(free.querySelector('.arcade-slot').getAttribute('aria-label'), 'View Free')
  assert.equal(free.querySelector('.arcade-coin, .arcade-slot-mouth'), null)
  assert.ok(paid.querySelector('.arcade-coin'))
  assert.ok(paid.querySelector('.arcade-slot-mouth'))
  assert.equal(paid.querySelector('.arcade-slot').getAttribute('aria-label'), 'Play Paid')
  await arcade.insertCoin('free')
})
