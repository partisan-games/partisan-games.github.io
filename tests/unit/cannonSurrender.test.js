import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import GameLoop from '/core/GameLoop.js'
import Garrison from '/scenes/cannon/Garrison.js'
import { chooseUiStyle, currentStyleClasses, uiStyleChoice } from '/ui/styles.js'

let Scene, UI, SurrenderChoice, FortFlag
before(async() => {
  createPageElements()
  Scene = (await import('/core/Scene.js')).default
  UI = (await import('/ui/UI.js')).default
  SurrenderChoice = (await import('/scenes/cannon/SurrenderChoice.js')).default
  FortFlag = (await import('/scenes/cannon/FortFlag.js')).default
})

function battle(t, { living = 4, whiteRaised = true } = {}) {
  // Exercise the real scene lifecycle and UI without creating a WebGL renderer or native physics world.
  const scene = Object.assign(Object.create(Scene.prototype), {
    session: new GameSession(),
    gameLoop: new GameLoop(() => {}),
    canvas: document.getElementById('platno'),
    player: { dead: false },
    defenders: { living, surrendered: false, surrender() {
      this.surrendered = true
    } },
    spaceHeld: true,
    power: { value: 25, reset() {
      this.value = 10
    } },
    syncSounds() {},
    garrison: new Garrison(10),
    flag: { whiteRaised, surrender() {} },
  })
  scene.ui = new UI(scene, { showControls: false })
  t.mock.method(scene.ui.victorySound, 'play', () => {})
  t.mock.method(scene.ui.defeatSound, 'play', () => {})
  scene.gameLoop.start()
  scene.session.start()
  scene.garrison.update(scene.defenders.living)
  scene.surrender = new SurrenderChoice(scene)
  t.after(() => {
    scene.gameLoop.stop()
    scene.session.dispose()
    scene.ui.end()
  })
  return scene
}

test('the Italian flag reaches the foot of the pole before the white flag rises', t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const flag = new FortFlag({ x: 0, z: 0 })
  const top = flag.cloth.position.y
  const italian = flag.cloth.material
  flag.surrender()
  flag.update(1)
  assert.equal(flag.state, 'lowering')
  assert.equal(flag.cloth.material, italian)
  assert.ok(flag.cloth.position.y < top)
  flag.update(.71)
  assert.equal(flag.state, 'raising')
  assert.notEqual(flag.cloth.material, italian)
  assert.equal(flag.whiteRaised, false)
  flag.update(1.7)
  assert.equal(flag.cloth.position.y, top)
  assert.equal(flag.whiteRaised, true)
})

test('the offer waits until the white flag is fully raised', t => {
  const scene = battle(t, { living: 5, whiteRaised: false })
  const lower = t.mock.method(scene.flag, 'surrender')
  scene.defenders.living--
  scene.surrender.update()
  assert.equal(scene.garrison.surrendered, true)
  assert.equal(scene.surrender.pending, false)
  assert.equal(lower.mock.callCount(), 1)
  scene.flag.whiteRaised = true
  scene.surrender.update()
  assert.equal(scene.surrender.pending, true)
})

test('the surrender pauses combat, resets held fire and waits for an explicit answer', t => {
  const scene = battle(t)
  scene.surrender.offer()
  assert.equal(scene.session.state, 'paused')
  assert.equal(scene.gameLoop.isPaused, true)
  assert.equal(scene.spaceHeld, false)
  assert.equal(scene.power.value, 10)
  assert.equal(scene.ui.screen, 'surrender')
  assert.equal(scene.ui.outro, '')
  assert.deepEqual([...document.querySelectorAll('#modal button')].map(button => button.textContent.trim()),
    ['Accept surrender', 'Continue attack'])
  assert.equal(document.activeElement, document.getElementById('modal'))
  const time = scene.session.clock.now
  scene.session.update(30)
  assert.equal(scene.session.clock.now, time)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
  assert.equal(document.activeElement.id, 'accept-surrender')
})

test('a surrender in the same frame as Esc is offered once when Continue resumes play', t => {
  const scene = battle(t, { living: 5 })
  const flag = t.mock.method(scene.flag, 'surrender')
  scene.pause()
  scene.defenders.living--
  scene.surrender.update()
  assert.equal(scene.garrison.surrendered, true)
  assert.equal(scene.surrender.pending, false)
  assert.equal(scene.ui.screen, 'pause')
  scene.unpause()
  scene.surrender.update()
  assert.equal(scene.surrender.pending, true)
  assert.equal(scene.ui.screen, 'surrender')
  assert.equal(scene.session.state, 'paused')
  assert.equal(flag.mock.callCount(), 1, 'the white flag is raised only once')
  scene.surrender.resolve(false)
  scene.surrender.update()
  assert.equal(scene.ui.screen, null)
})

test('the surrender dialog follows the saved UI choice and subsequent style changes', t => {
  const saved = uiStyleChoice()
  t.after(() => chooseUiStyle(saved))
  chooseUiStyle('white')
  const scene = battle(t)
  scene.surrender.offer()
  for (const choice of ['white', 'ww2']) {
    chooseUiStyle(choice)
    const { container, button } = currentStyleClasses()
    assert.ok(document.querySelector(`#modal .${container.split(' ').join('.')}`))
    for (const control of document.querySelectorAll('#modal button'))
      assert.equal(control.className, button)
    scene.surrender.show()
    assert.ok(document.querySelector(`#modal .${container.split(' ').join('.')}`))
    assert.equal(document.getElementById('accept-surrender').className, button)
  }
})

test('accepting surrender resumes the scene so unarmed survivors can march out', t => {
  const scene = battle(t)
  scene.surrender.update()
  assert.equal(scene.surrender.pending, true)
  assert.equal(scene.ui.outro, '')
  scene.surrender.resolve(true)
  assert.equal(scene.surrender.accepted, true)
  assert.equal(scene.defenders.surrendered, true)
  assert.equal(scene.session.state, 'running')
  assert.equal(scene.gameLoop.isPaused, false)
  assert.equal(scene.ui.outro, '')
  scene.surrender.resolve(false)
  scene.surrender.resolve(true)
  assert.equal(scene.defenders.surrendered, true)
})

test('continuing resumes combat without another surrender or an automatic victory', t => {
  const scene = battle(t)
  scene.surrender.offer()
  scene.surrender.resolve(false)
  assert.equal(scene.surrender.rejected, true)
  assert.equal(scene.session.state, 'running')
  assert.equal(scene.gameLoop.isPaused, false)
  assert.equal(scene.ui.screen, null)
  assert.equal(scene.flag.whiteRaised, true)
  assert.equal(document.activeElement, scene.canvas)
  scene.surrender.offer()
  scene.session.update(10)
  assert.equal(scene.ui.outro, '')
  assert.equal(scene.session.state, 'running')
})

test('a garrison at half strength keeps fighting', t => {
  const scene = battle(t, { living: 5 })
  scene.surrender.update()
  assert.equal(scene.surrender.pending, false)
  assert.equal(scene.session.state, 'running')
})

test('no surrender decision interrupts a dead player or a garrison with no survivors', t => {
  const scene = battle(t)
  scene.player.dead = true
  scene.surrender.offer()
  assert.equal(scene.surrender.pending, false)
  scene.player.dead = false
  scene.defenders.living = 0
  scene.surrender.offer()
  assert.equal(scene.surrender.pending, false)
  scene.surrender.resolve(true)
  assert.equal(scene.session.state, 'running')
})
