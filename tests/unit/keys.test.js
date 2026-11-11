import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Keyboard, controls, Controls

before(async() => {
  createPageElements()
  Keyboard = (await import('/core/io/Keyboard.js')).default
  controls = await import('/ui/Controls.js')
  Controls = controls.default
})

const codes = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyC', 'KeyV',
  'PageUp', 'PageDown', 'ShiftLeft', 'ShiftRight', 'CapsLock', 'Space', 'Enter', 'Escape', 'KeyX', 'ControlLeft',
]

// which keys turned each action on before the keys moved to one list
const recorded = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  strafeLeft: ['KeyQ', 'PageUp'],
  strafeRight: ['KeyE', 'PageDown'],
  run: ['ShiftLeft'],
  jump: ['Space'],
  attack: ['Enter'],
  attack2: ['KeyC'],
  special: ['KeyV'],
}

function press(type, code, capsLock = false) {
  const event = new KeyboardEvent(type, { code })
  event.getModifierState = key => key === 'CapsLock' && capsLock // happy-dom does not track lock keys
  document.dispatchEvent(event)
}

/** Presses every key alone and lists the keys that turn the action on. */
function keysFor(keyboard, action) {
  return codes.filter(code => {
    press('keydown', code)
    const on = Boolean(keyboard[action])
    press('keyup', code)
    return on
  }).sort()
}

for (const [action, expected] of Object.entries(recorded))
  test(`the ${action} action listens to the same keys`, t => {
    const keyboard = new Keyboard()
    t.after(() => keyboard.end())
    assert.deepEqual(keysFor(keyboard, action), [...expected].sort())
  })

test('the attack key can be set per game, the pointer included', t => {
  const keyboard = new Keyboard({ attackKey: 'pointer' })
  t.after(() => keyboard.end())
  assert.deepEqual(keysFor(keyboard, 'attack'), [])
  document.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }))
  assert.equal(keyboard.attack, true)
  document.dispatchEvent(new PointerEvent('pointerup', { button: 0 }))
})

test('CapsLock turns running on and off by its lock state, not while it is held', t => {
  const keyboard = new Keyboard()
  t.after(() => keyboard.end())

  press('keydown', 'CapsLock')
  assert.equal(Boolean(keyboard.run), false)
  press('keyup', 'CapsLock', true)
  assert.equal(Boolean(keyboard.run), true)
  press('keydown', 'CapsLock')
  press('keyup', 'CapsLock', false)
  assert.equal(Boolean(keyboard.run), false)
})

/** The text of a controls list as the player opens it. */
function controlsText(controlKeys) {
  const list = new Controls({ controlKeys })
  const text = list.div.querySelector('div').innerHTML
  list.end()
  return text
}

test('the controls lists show the same keys and actions', () => {
  assert.equal(controlsText(controls.baseControls), '← or A - left<br>→ or D - right<br>↑ or W - forward<br>↓ or S - backward<br>Esc - pause<br>')
  assert.equal(controlsText(controls.avatarControls), '← or A - left<br>→ or D - right<br>↑ or W - forward<br>↓ or S - backward<br>Esc - pause<br>CapsLock - run<br>Space - jump<br>')
  assert.equal(controlsText(controls.fpsControls), '← or A - left<br>→ or D - right<br>↑ or W - forward<br>↓ or S - backward<br>Esc - pause<br>Q - strafe left<br>E - strafe right<br>CapsLock - run<br>Mouse - attack<br>Space - jump<br>')
  assert.equal(controlsText(controls.thirdPersonControls), '← or A - left<br>→ or D - right<br>↑ or W - forward<br>↓ or S - backward<br>Esc - pause<br>CapsLock - run<br>Enter - attack<br>Space - jump<br>')
  assert.equal(controlsText(controls.tankLeftControls), 'A - left<br>D - right<br>W - up<br>S - down<br>Space - shoot<br>')
  assert.equal(controlsText(controls.tankRightControls), '← - left<br>→ - right<br>↑ - up<br>↓ - down<br>Enter - shoot<br>')
})

/** Holds each key alone for one frame, then releases it, and lists what the vehicle did for it. */
function actionsOf(vehicle, methods, reset = () => {}) {
  const result = {}
  let current
  for (const name of methods) vehicle[name] = () => result[current].push(name)
  for (const code of codes) {
    current = code
    result[code] = []
    press('keydown', code)
    vehicle.handleInput(1 / 60)
    press('keyup', code)
    vehicle.handleInput(1 / 60)
    reset()
    if (!result[code].length) delete result[code]
  }
  return result
}

test('the left tank drives, aims and fires with A, D, W, S and Space', async() => {
  const { default: TenkLevo } = await import('/scenes/tenkici/TenkLevo.js')
  const tank = new TenkLevo({ x: 100, xLimit: 500 })
  assert.deepEqual(actionsOf(tank, ['dodajSilu', 'diziCev', 'spustajCev', 'pucaj']), {
    KeyA: ['dodajSilu'], KeyD: ['dodajSilu'], KeyW: ['diziCev'], KeyS: ['spustajCev'], Space: ['pucaj'],
  })
})

test('the right tank drives, aims and fires with the arrows and Enter', async() => {
  const { default: TenkDesno } = await import('/scenes/tenkici/TenkDesno.js')
  const { default: platno } = await import('/core/io/platno.js')
  const tank = new TenkDesno({ ai: false })
  tank.x = platno.width * .75
  assert.deepEqual(actionsOf(tank, ['dodajSilu', 'diziCev', 'spustajCev', 'pucaj']), {
    ArrowLeft: ['dodajSilu'], ArrowRight: ['dodajSilu'], ArrowUp: ['diziCev'], ArrowDown: ['spustajCev'], Enter: ['pucaj'],
  })
})

test('the ustanak cannon aims with W and S and fires when Space is released', async() => {
  const { default: Top } = await import('/scenes/ustanak/Top.js')
  const cannon = new Top({ x: 230, y: 300 })
  const angles = {}
  for (const code of ['KeyW', 'KeyS']) {
    cannon.ugao = 6
    press('keydown', code)
    cannon.handleInput(1)
    press('keyup', code)
    angles[code] = Number(cannon.ugao.toFixed(4))
  }
  assert.deepEqual(angles, { KeyW: 5.68, KeyS: 6.2 })
  assert.deepEqual(actionsOf(cannon, ['pali'], () => {
    cannon.sila = cannon.minSila // what firing does
  }), { Space: ['pali'] })
})
