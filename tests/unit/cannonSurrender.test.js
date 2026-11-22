import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import GameLoop from '/core/GameLoop.js'
import Garrison from '/scenes/cannon/Garrison.js'
import { chooseUiStyle, currentStyleClasses, uiStyleChoice } from '/ui/styles.js'

let Scene, UI, SurrenderChoice
before(async() => {
  createPageElements()
  Scene = (await import('/core/Scene.js')).default
  UI = (await import('/ui/UI.js')).default
  SurrenderChoice = (await import('/scenes/cannon/SurrenderChoice.js')).default
})

function battle(t, { standing = 80, gunsLeft = 0 } = {}) {
  // Exercise the real scene lifecycle and UI without creating a WebGL renderer or native physics world.
  const scene = Object.assign(Object.create(Scene.prototype), {
    session: new GameSession(),
    gameLoop: new GameLoop(() => {}),
    canvas: document.getElementById('platno'),
    player: { dead: false },
    standing,
    spaceHeld: true,
    power: { value: 25, reset() {
      this.value = 10
    } },
    syncSounds() {},
    garrison: new Garrison(),
    posts: Array.from({ length: gunsLeft }, () => ({})),
    flag: { surrender() {} },
  })
  scene.ui = new UI(scene, { showControls: false })
  t.mock.method(scene.ui.victorySound, 'play', () => {})
  t.mock.method(scene.ui.defeatSound, 'play', () => {})
  scene.gameLoop.start()
  scene.session.start()
  scene.garrison.update(scene.posts.length)
  scene.surrender = new SurrenderChoice(scene)
  t.after(() => {
    scene.gameLoop.stop()
    scene.session.dispose()
    scene.ui.end()
  })
  return scene
}

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
  const scene = battle(t, { gunsLeft: 1 })
  const flag = t.mock.method(scene.flag, 'surrender')
  scene.pause()
  scene.posts.pop()
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
  for (const choice of ['white', 'rpg', 'simple']) {
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

test('accepting surrender ends the game with victory once', t => {
  const scene = battle(t)
  const victory = t.mock.method(scene, 'victory')
  scene.surrender.update()
  assert.equal(scene.surrender.pending, true)
  assert.equal(scene.ui.outro, '')
  scene.surrender.resolve(true)
  assert.equal(scene.session.state, 'finished')
  assert.equal(scene.gameLoop.isPaused, false)
  assert.match(scene.ui.outro, /The garrison has surrendered\./)
  scene.surrender.resolve(false)
  scene.surrender.resolve(true)
  assert.equal(victory.mock.callCount(), 1)
})

test('continuing resumes combat without another surrender or an automatic victory', t => {
  const scene = battle(t)
  scene.surrender.offer()
  scene.surrender.resolve(false)
  assert.equal(scene.surrender.rejected, true)
  assert.equal(scene.session.state, 'running')
  assert.equal(scene.gameLoop.isPaused, false)
  assert.equal(scene.ui.screen, null)
  assert.equal(document.activeElement, scene.canvas)
  scene.surrender.offer()
  scene.session.update(10)
  assert.equal(scene.ui.outro, '')
  assert.equal(scene.session.state, 'running')
})

test('a garrison with an active gun keeps fighting', t => {
  const scene = battle(t, { standing: 10, gunsLeft: 1 })
  scene.surrender.update()
  assert.equal(scene.surrender.pending, false)
  assert.equal(scene.session.state, 'running')
})

test('no surrender decision interrupts a dead player or an already destroyed fort', t => {
  const scene = battle(t)
  scene.player.dead = true
  scene.surrender.offer()
  assert.equal(scene.surrender.pending, false)
  scene.player.dead = false
  scene.standing = 0
  scene.surrender.offer()
  assert.equal(scene.surrender.pending, false)
  scene.surrender.resolve(true)
  assert.equal(scene.session.state, 'running')
})
