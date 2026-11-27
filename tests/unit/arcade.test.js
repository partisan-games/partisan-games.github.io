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

test('only the token in the pocket turns, while one is left; those on the cabinets stand still', async t => {
  const { iconImages } = await import('/core/io/icons.js')
  document.body.insertAdjacentHTML('beforeend', `<img class="arcade-coin cabinet-coin" src="/assets/images/${iconImages.coinStill}" alt="">`)
  const arcade = new Arcade()
  t.after(() => arcade.dispose())
  const pocket = () => arcade.wallet.querySelector('.arcade-coin').getAttribute('src')
  const cabinet = () => document.querySelector('.cabinet-coin').getAttribute('src')
  t.mock.method(arcade.coins, 'read', () => ({ remaining: 3 }))
  arcade.refresh()
  assert.ok(pocket().endsWith(iconImages.coin))
  assert.ok(cabinet().endsWith(iconImages.coinStill))
  arcade.coins.read.mock.mockImplementation(() => ({ remaining: 0 }))
  arcade.refresh()
  assert.ok(pocket().endsWith(iconImages.coinStill))
})
