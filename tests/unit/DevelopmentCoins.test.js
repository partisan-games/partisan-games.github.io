import { test } from 'node:test'
import assert from 'node:assert/strict'
import DevelopmentCoins, { isLocalCoinHost, developmentCoinStorageKey } from '../../ui/DevelopmentCoins.js'
import { coinStorageKey } from '../../ui/DailyCoins.js'

test('development coins apply only to explicit local hosts', () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', '::1']) assert.equal(isLocalCoinHost(hostname), true)
  for (const hostname of ['partisan-games.github.io', 'localhost.example.com', '127.0.0.1.example.com', 'coins.test', ''])
    assert.equal(isLocalCoinHost(hostname), false)
})

function wallet() {
  const values = new Map()
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  let date = new Date(2026, 10, 14)
  const options = { storage, now: () => date, locks: undefined }
  return { coins: new DevelopmentCoins(options), options, storage, setDate: value => { date = value } }
}

test('local balance starts at 1000, spends, persists across reload and refunds without changing the ordinary wallet', async() => {
  const { coins, options, storage } = wallet()
  const ordinaryBalance = JSON.stringify({ day: '2026-11-14', remaining: 0 })
  storage.setItem(coinStorageKey, ordinaryBalance)
  assert.equal(coins.read().remaining, 1000)
  const receipt = await coins.spend()
  assert.equal(coins.read().remaining, 999)
  const reloaded = new DevelopmentCoins(options)
  assert.equal(reloaded.read().remaining, 999)
  await reloaded.refund(receipt)
  assert.equal(reloaded.read().remaining, 1000)
  assert.equal(JSON.parse(storage.getItem(developmentCoinStorageKey)).remaining, 1000)
  assert.equal(storage.getItem(coinStorageKey), ordinaryBalance)
})

test('local coins run out after 1000 entries and reset next day without carrying a refund forward', async() => {
  const { coins, setDate } = wallet()
  const receipts = await Promise.all(Array.from({ length: 1001 }, () => coins.spend()))
  assert.equal(receipts.filter(Boolean).length, 1000)
  assert.equal(coins.read().remaining, 0)
  setDate(new Date(2026, 10, 15))
  assert.equal(coins.read().remaining, 1000)
  await coins.spend()
  await coins.refund(receipts[0])
  assert.equal(coins.read().remaining, 999)
})
