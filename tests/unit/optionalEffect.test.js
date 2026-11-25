import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEffectHandler } from '/core/runtime/optionalEffect.js'
import World from '/core/World.js'

const { run: optionalEffect } = createEffectHandler(false)

test('a failing optional operation logs once and leaves other operations and owners working', t => {
  const warn = t.mock.method(console, 'warn', () => {})
  const owner = {}, error = new Error('broken particles')
  let calls = 0
  const broken = () => {
    calls++
    throw error
  }
  assert.equal(optionalEffect(owner, 'particles', broken), null)
  assert.equal(optionalEffect(owner, 'particles', broken), null)
  assert.equal(calls, 1)
  assert.equal(warn.mock.calls.length, 1)
  assert.equal(warn.mock.calls[0].arguments[1], error)
  assert.equal(optionalEffect(owner, 'sound', () => 42), 42)
  assert.equal(optionalEffect({}, 'particles', () => 7), 7)
})

test('an asynchronous optional failure is handled without an unhandled rejection', async t => {
  const warn = t.mock.method(console, 'warn', () => {})
  const owner = {}, error = new Error('effect import failed')
  assert.equal(await optionalEffect(owner, 'effect', async() => {
    throw error
  }), null)
  assert.equal(optionalEffect(owner, 'effect', () => assert.fail('disabled effect ran again')), null)
  assert.equal(warn.mock.calls.length, 1)
  assert.equal(warn.mock.calls[0].arguments[1], error)
})

test('simulation errors still propagate instead of being silently treated as effects', t => {
  const warn = t.mock.method(console, 'warn', () => {})
  const world = new World(), error = new Error('broken simulation')
  world.add({ update() {
    throw error
  } })
  assert.throws(() => world.update(.1, 0), candidate => candidate === error)
  assert.equal(warn.mock.calls.length, 0)
})

test('development throws the original error on every attempt without logging or disabling the effect', t => {
  const warn = t.mock.method(console, 'warn', () => {})
  const handler = createEffectHandler(true), owner = {}, error = new Error('broken effect')
  let calls = 0
  const broken = () => {
    calls++
    throw error
  }
  for (let i = 0; i < 2; i++) assert.throws(() => handler.run(owner, 'effect', broken), value => value === error)
  assert.throws(() => handler.fail(owner, 'effect import', error), value => value === error)
  assert.equal(calls, 2)
  assert.equal(warn.mock.calls.length, 0)
})

test('development preserves asynchronous rejection and the original successful promise', async t => {
  const warn = t.mock.method(console, 'warn', () => {})
  const handler = createEffectHandler(true), owner = {}, error = new Error('async effect failed')
  const rejected = Promise.reject(error)
  const result = handler.run(owner, 'effect', () => rejected)
  assert.equal(result, rejected)
  await assert.rejects(result, value => value === error)
  const success = Promise.resolve(42)
  assert.equal(handler.run(owner, 'effect', () => success), success)
  assert.equal(await success, 42)
  assert.equal(warn.mock.calls.length, 0)
})
