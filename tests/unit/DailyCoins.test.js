import { test } from 'node:test'
import assert from 'node:assert/strict'
import DailyCoins, { coinStorageKey } from '../../ui/DailyCoins.js'

function wallet() {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  let date = new Date(2026, 10, 14, 23, 59)
  const coins = new DailyCoins({ storage, now: () => date, locks: undefined })
  return { coins, storage, setDate: value => { date = value } }
}

test('all games share ten coins; refresh does not refill the spent allowance', async() => {
  const { coins, storage } = wallet()
  assert.equal(coins.read().remaining, 10)
  await coins.spend()
  await coins.spend()
  assert.equal(coins.read().remaining, 8)
  const reloaded = new DailyCoins({ storage, now: () => new Date(2026, 10, 14), locks: undefined })
  assert.equal(reloaded.read().remaining, 8)
})

test('the eleventh entry is refused and the balance cannot become negative', async() => {
  const { coins } = wallet()
  const receipts = await Promise.all(Array.from({ length: 11 }, () => coins.spend()))
  assert.equal(receipts.filter(Boolean).length, 10)
  assert.equal(coins.read().remaining, 0)
})

test('a new local calendar day replaces the balance with ten, without rollover', async() => {
  const { coins, setDate, storage } = wallet()
  await coins.spend()
  assert.equal(coins.read().remaining, 9)
  setDate(new Date(2026, 10, 15, 0, 0))
  assert.equal(coins.read().remaining, 10)
  assert.equal(JSON.parse(storage.getItem(coinStorageKey)).day, '2026-11-14', 'a display refresh never overwrites another tab’s transaction')
  await coins.spend()
  assert.equal(coins.read().remaining, 9)
  setDate(new Date(2027, 0, 1))
  assert.equal(coins.read().remaining, 10)
})

test('failed loads refund the same day, and never increase tomorrow above ten', async() => {
  const { coins, setDate } = wallet()
  const first = await coins.spend()
  await coins.refund(first)
  assert.equal(coins.read().remaining, 10)
  const yesterday = await coins.spend()
  setDate(new Date(2026, 10, 15))
  await coins.spend()
  await coins.refund(yesterday)
  assert.equal(coins.read().remaining, 9)
})

test('transactions in different wallets use the same browser lock and storage', async() => {
  const { storage } = wallet()
  let queue = Promise.resolve()
  const names = []
  const locks = { request(name, action) {
    names.push(name)
    const result = queue.then(action)
    queue = result.catch(() => {})
    return result
  } }
  const options = { storage, now: () => new Date(2026, 10, 14), locks }
  const a = new DailyCoins(options), b = new DailyCoins(options)
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) => (index % 2 ? a : b).spend()))
  assert.equal(results.filter(Boolean).length, 10)
  assert.equal(b.read().remaining, 0)
  assert.ok(names.every(name => name === coinStorageKey))
})

test('a broken saved record resets safely, but denied storage does not grant free entries', async() => {
  const { coins, storage } = wallet()
  storage.setItem(coinStorageKey, '{bad json')
  assert.equal(coins.read().remaining, 10)
  storage.setItem(coinStorageKey, JSON.stringify({ day: '2026-11-14', remaining: -2 }))
  assert.equal(coins.read().remaining, 10)
  storage.setItem = () => { throw new Error('Storage disabled') }
  await assert.rejects(coins.spend(), /Storage disabled/)
})
