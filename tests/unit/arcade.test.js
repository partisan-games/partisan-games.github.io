import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

createPageElements()
const { default: Arcade } = await import('/ui/Arcade.js')

test('a disposed cabinet stops its midnight timer and leaves the page', t => {
  const clearTimeout = t.mock.method(globalThis, 'clearTimeout')
  const arcade = new Arcade()
  const refresh = t.mock.method(arcade.wallet, 'querySelector')

  arcade.dispose()
  window.dispatchEvent(new Event('focus'))
  document.dispatchEvent(new Event('visibilitychange'))

  assert.ok(clearTimeout.mock.calls.some(call => call.arguments[0] === arcade.resetTimer), 'the midnight timer would keep Node running for hours')
  assert.equal(refresh.mock.callCount(), 0, 'no listener refreshes a disposed cabinet')
  assert.ok(!arcade.wallet.isConnected)
  assert.ok(!arcade.dialog.isConnected)
})

test('an animation plays without a coin: its card gets no coin slot', () => {
  const card = (path, free) => {
    const element = document.createElement('div')
    element.className = 'menu-item'
    element.dataset.path = path
    if (free) element.dataset.free = ''
    element.innerHTML = `<h3>${path}</h3><img alt="">`
    document.body.append(element)
    return element
  }
  const game = card('game', false)
  const animation = card('animation', true)
  const arcade = new Arcade()
  try {
    assert.equal(arcade.isFree('animation'), true)
    assert.equal(arcade.isFree('game'), false)
    assert.ok(game.querySelector('[data-arcade-game]'), 'a game takes a coin')
    assert.equal(animation.querySelector('[data-arcade-game]'), null)
  } finally {
    arcade.dispose()
    game.remove()
    animation.remove()
  }
})
