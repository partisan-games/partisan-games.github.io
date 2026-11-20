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
})

