import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import Keyboard from '/core/io/Keyboard.js'
import Touch from '/core/io/Touch.js'
import { icons } from '/core/io/icons.js'
import { createPageElements } from './helpers/dom.js'

let UI, Controls
before(async() => {
  createPageElements()
  UI = (await import('/ui/UI.js')).default
  Controls = (await import('/ui/Controls.js')).default
})

const key = (element, type, code, extra = {}) => {
  const event = new KeyboardEvent(type, { key: code, code, bubbles: true, cancelable: true, ...extra })
  element.dispatchEvent(event)
  return event
}

test('native UI keys remain available and releasing over UI clears gameplay input', t => {
  const keyboard = new Keyboard()
  const slider = document.createElement('input')
  slider.type = 'range'
  document.body.append(slider)
  t.after(() => {
    keyboard.end(); slider.remove()
  })
  document.body.focus()
  assert.equal(key(document.body, 'keydown', 'ArrowRight').defaultPrevented, true)
  assert.equal(keyboard.right, true)
  key(slider, 'keyup', 'ArrowRight')
  assert.equal(keyboard.right, false)
  slider.focus()
  assert.equal(key(slider, 'keydown', 'ArrowRight').defaultPrevented, false)
  assert.equal(keyboard.right, false)
  assert.equal(key(slider, 'keydown', 'Space').defaultPrevented, false)
  assert.equal(keyboard.jump, false)
})

test('a disclosure summary keeps its native keys and clears held gameplay input on focus', t => {
  const keyboard = new Keyboard()
  const details = document.createElement('details')
  details.innerHTML = '<summary><span>2D</span></summary><a href="#actor">Actor</a>'
  document.body.append(details)
  t.after(() => {
    keyboard.end(); details.remove()
  })
  document.body.focus()
  key(document.body, 'keydown', 'ArrowRight')
  assert.equal(keyboard.right, true)
  const summary = details.querySelector('summary')
  summary.focus()
  assert.equal(keyboard.right, false)
  for (const code of ['Space', 'Enter', 'ArrowDown'])
    assert.equal(key(summary.querySelector('span'), 'keydown', code).defaultPrevented, false)
  assert.equal(keyboard.jump, false)
  assert.equal(keyboard.attack, false)
  assert.equal(keyboard.down, false)
})

test('canceling a pointer without a left-button release cannot leave fire held', t => {
  const keyboard = new Keyboard({ attackKey: 'pointer' })
  t.after(() => keyboard.end())
  const canvas = document.getElementById('platno')
  canvas.tabIndex = -1
  canvas.focus()
  canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
  assert.equal(keyboard.attack, true)
  canvas.dispatchEvent(new PointerEvent('pointercancel', { button: -1, bubbles: true }))
  assert.equal(keyboard.attack, false)
})

test('opening a modal clears held input and keeps Tab inside without swallowing native activation', t => {
  const keyboard = new Keyboard()
  const ui = new UI({ sceneUI: () => '' })
  t.after(() => {
    ui.end(); keyboard.end()
  })
  document.body.focus()
  key(document.body, 'keydown', 'ArrowUp')
  assert.equal(keyboard.up, true)
  ui.showPauseScreen()
  assert.equal(keyboard.up, false)
  const modal = document.getElementById('modal')
  const buttons = [...modal.querySelectorAll('button')]
  assert.equal(document.activeElement, buttons[0])
  key(buttons[0], 'keydown', 'Tab', { shiftKey: true })
  assert.equal(document.activeElement, buttons.at(-1))
  key(buttons.at(-1), 'keydown', 'Tab')
  assert.equal(document.activeElement, buttons[0])
  assert.equal(key(buttons[0], 'keydown', 'Enter').defaultPrevented, false)
  ui.hideScreen()
  assert.equal(keyboard.up, false, 'closing a modal cannot resurrect a held key')
  assert.equal(modal.hasAttribute('aria-modal'), false)
})

test('Controls use click activation and cannot toggle behind a modal', t => {
  const controls = new Controls()
  const ui = new UI({ sceneUI: () => '' })
  t.after(() => {
    controls.end(); ui.end()
  })
  const [button, content] = controls.div.children
  button.click()
  assert.equal(content.style.display, 'block')
  ui.showPauseScreen()
  button.click()
  assert.equal(content.style.display, 'block')
  ui.hideScreen()
  button.click()
  assert.equal(content.style.display, 'none')
})

test('a game\'s Controls open and close on the start and pause screens, and stay blocked behind a native dialog', t => {
  const ui = new UI({ sceneUI: () => '', controlKeys: { Space: 'jump' } })
  t.after(() => ui.end())
  const [button, content] = ui.controlsUI.div.children
  ui.showScreen('start', '<div><button id="start">Start</button></div>')
  button.click()
  assert.equal(content.style.display, 'block')
  button.click()
  assert.equal(content.style.display, 'none')
  ui.showPauseScreen()
  button.click()
  assert.equal(content.style.display, 'block')
  button.click()
  assert.equal(content.style.display, 'none')
  const dialog = document.createElement('dialog')
  document.body.append(dialog)
  dialog.showModal()
  button.click()
  assert.equal(content.style.display, 'none')
  dialog.close()
  dialog.remove()
})

test('Controls opened with the mouse give the game its keys back; opened from the keyboard, they keep the focus', t => {
  const keyboard = new Keyboard()
  const controls = new Controls()
  t.after(() => {
    controls.end(); keyboard.end()
  })
  const [button] = controls.div.children
  button.focus()
  button.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }))
  key(document.activeElement, 'keydown', 'Enter')
  assert.equal(keyboard.pressed.Enter, true, 'Enter fires again after a mouse click on Controls')
  key(document.activeElement, 'keyup', 'Enter')
  button.focus()
  button.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }))
  assert.equal(document.activeElement, button)
})

test('a native dialog above a game screen keeps its own Tab navigation', t => {
  const ui = new UI({ sceneUI: () => '' })
  ui.showPauseScreen()
  const dialog = document.createElement('dialog')
  dialog.innerHTML = '<button>Back</button><button>Insert</button>'
  document.body.append(dialog)
  dialog.showModal()
  t.after(() => {
    dialog.close(); dialog.remove(); ui.end()
  })
  const button = dialog.querySelector('button')
  button.focus()
  assert.equal(key(button, 'keydown', 'Tab').defaultPrevented, false)
  assert.equal(key(button, 'keydown', 'Tab', { shiftKey: true }).defaultPrevented, false)
})

test('two pointers holding one touch action release independently; keyboard holds and resets use the same action', t => {
  const touch = new Touch({ useJoystick: true, buttonDict: { attack: icons.shoot } })
  t.after(() => touch.end())
  const button = touch.buttonContainer.querySelector('button')
  const pointer = (type, pointerId) => button.dispatchEvent(new PointerEvent(type, { pointerId, bubbles: true, cancelable: true }))
  pointer('pointerdown', 1)
  pointer('pointerdown', 2)
  pointer('pointerup', 1)
  assert.equal(touch.attack, true)
  pointer('pointercancel', 2)
  assert.equal(touch.attack, false)
  button.focus()
  key(button, 'keydown', 'Space')
  assert.equal(touch.attack, true)
  key(button, 'keyup', 'Space')
  assert.equal(touch.attack, false)
  key(button, 'keydown', 'Enter')
  window.dispatchEvent(new Event('blur'))
  assert.equal(touch.attack, false)
  pointer('pointerdown', 3)
  document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(touch.attack, false)
  pointer('pointerdown', 4)
  document.dispatchEvent(new Event('game-input-reset'))
  assert.equal(touch.attack, false)
})

test('touch catalog preserves missing, empty and unknown bindings and their order', t => {
  const omitted = new Touch({ useJoystick: false })
  const touch = new Touch({ useJoystick: false, buttonDict: { special: '', unknown: 'ignored', attack: icons.magic, jump: '' } })
  t.after(() => {
    omitted.end(); touch.end()
  })
  assert.equal(omitted.buttonContainer, undefined)
  assert.deepEqual([...touch.buttonContainer.children].map(button => button.innerText), [icons.special, icons.magic, icons.jump])
  const modal = document.getElementById('modal')
  modal.innerHTML = '<div>Paused</div>'
  t.after(() => {
    modal.innerHTML = ''
  })
  touch.buttonContainer.children[1].dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true }))
  assert.equal(touch.attack, false)
})

test('shooting handlers reject inactive phases and UI clicks, and aim at the triggering click', async t => {
  const { default: Neretva } = await import('/scenes/neretva/Main.js')
  const { default: Otpisani } = await import('/scenes/otpisani/Main.js')
  const canvas = document.getElementById('platno')
  const button = document.createElement('button')
  document.body.append(button)
  t.after(() => button.remove())
  for (const SceneType of [Neretva, Otpisani]) {
    let shots = 0, hits = 0, aim = null
    // a soldier standing in each row and an occupier, all drawn where the click lands
    const target = { body: { alive: true, standing: true, setState: () => hits++ }, view: { x: 123, y: 45, width: 10, height: 10 } }
    const scene = {
      session: { state: 'ready' }, ui: { screen: null }, energija: 100, player: { shotSound: { play: () => shots++ } },
      proveriPogotke: (rows, point) => {
        aim = point; hits++
        return true
      },
      daljiRovovi: [target], bliziRovovi: [target], occupiers: [target], audio: { setPlaying() {} }, airAttack: { shoot: () => false },
    }
    const click = target => SceneType.prototype.handleClick.call(scene, { target, pageX: 123, pageY: 45 })
    for (const state of ['loading', 'ready', 'paused', 'finished', 'disposed']) {
      scene.session.state = state
      click(canvas)
    }
    scene.session.state = 'running'
    click(button)
    scene.ui.screen = 'pause'
    click(canvas)
    assert.equal(shots + hits, 0)
    scene.ui.screen = null
    click(canvas)
    assert.equal(shots, 1)
    assert.equal(hits, 1)
    if (SceneType === Neretva) assert.deepEqual(aim, { x: 123, y: 45 })
  }
})
