import { test } from 'node:test'
import assert from 'node:assert/strict'
import DailyTokens, { tokenStorageKey } from '../../ui/DailyTokens.js'

function wallet() {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  let date = new Date(2026, 10, 14, 23, 59)
  const tokens = new DailyTokens({ storage, now: () => date, locks: undefined })
  return { tokens, storage, setDate: value => { date = value } }
}

test('all games share ten tokens; refresh does not refill the spent allowance', async() => {
  const { tokens, storage } = wallet()
  assert.equal(tokens.read().remaining, 10)
  await tokens.spend()
  await tokens.spend()
  assert.equal(tokens.read().remaining, 8)
  const reloaded = new DailyTokens({ storage, now: () => new Date(2026, 10, 14), locks: undefined })
  assert.equal(reloaded.read().remaining, 8)
})

test('the eleventh entry is refused and the balance cannot become negative', async() => {
  const { tokens } = wallet()
  const receipts = await Promise.all(Array.from({ length: 11 }, () => tokens.spend()))
  assert.equal(receipts.filter(Boolean).length, 10)
  assert.equal(tokens.read().remaining, 0)
})

test('a new local calendar day replaces the balance with ten, without rollover', async() => {
  const { tokens, setDate, storage } = wallet()
  await tokens.spend()
  assert.equal(tokens.read().remaining, 9)
  setDate(new Date(2026, 10, 15, 0, 0))
  assert.equal(tokens.read().remaining, 10)
  assert.equal(JSON.parse(storage.getItem(tokenStorageKey)).day, '2026-11-14', 'a display refresh never overwrites another tab’s transaction')
  await tokens.spend()
  assert.equal(tokens.read().remaining, 9)
  setDate(new Date(2027, 0, 1))
  assert.equal(tokens.read().remaining, 10)
})

test('failed loads refund the same day, and never increase tomorrow above ten', async() => {
  const { tokens, setDate } = wallet()
  const first = await tokens.spend()
  await tokens.refund(first)
  assert.equal(tokens.read().remaining, 10)
  const yesterday = await tokens.spend()
  setDate(new Date(2026, 10, 15))
  await tokens.spend()
  await tokens.refund(yesterday)
  assert.equal(tokens.read().remaining, 9)
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
  const a = new DailyTokens(options), b = new DailyTokens(options)
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) => (index % 2 ? a : b).spend()))
  assert.equal(results.filter(Boolean).length, 10)
  assert.equal(b.read().remaining, 0)
  assert.ok(names.every(name => name === tokenStorageKey))
})

test('a broken saved record resets safely, but denied storage does not grant free entries', async() => {
  const { tokens, storage } = wallet()
  storage.setItem(tokenStorageKey, '{bad json')
  assert.equal(tokens.read().remaining, 10)
  storage.setItem(tokenStorageKey, JSON.stringify({ day: '2026-11-14', remaining: -2 }))
  assert.equal(tokens.read().remaining, 10)
  storage.setItem = () => { throw new Error('Storage disabled') }
  await assert.rejects(tokens.spend(), /Storage disabled/)
})
