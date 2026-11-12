import { test } from 'node:test'
import assert from 'node:assert/strict'
import Health from '../../core/gameplay/Health.js'

test('health starts full with the default or the given maximum', () => {
  const defaults = new Health()
  assert.equal(defaults.current, 100)
  assert.equal(defaults.maximum, 100)
  assert.equal(defaults.alive, true)

  const custom = new Health({ maximum: 40 })
  assert.equal(custom.current, 40)
  assert.equal(custom.maximum, 40)
  assert.equal(custom.alive, true)
})

test('damage reports death only on the hit that crosses zero', () => {
  const health = new Health({ maximum: 40 })
  assert.equal(health.damage(15), false)
  assert.equal(health.current, 25)
  assert.equal(health.alive, true)
  assert.equal(health.damage(30), true)
  assert.equal(health.current, 0)
  assert.equal(health.alive, false)
  assert.equal(health.damage(30), false)
  assert.equal(health.current, 0)
  assert.equal(health.maximum, 40)
})

test('a hit equal to the remaining health kills, and zero damage never kills', () => {
  const health = new Health({ maximum: 20 })
  assert.equal(health.damage(0), false)
  assert.equal(health.current, 20)
  assert.equal(health.damage(20), true)
  assert.equal(health.damage(0), false)
})

test('healing restores health and stops at the maximum', () => {
  const health = new Health({ maximum: 50 })
  health.damage(30)
  health.heal(10)
  assert.equal(health.current, 30)
  health.heal(0)
  assert.equal(health.current, 30)
  health.heal(100)
  assert.equal(health.current, 50)
  assert.equal(health.maximum, 50)
})

test('health can be restored from zero, allowing another distinct death', () => {
  const health = new Health({ maximum: 10 })
  assert.equal(health.damage(10), true)
  health.heal(2)
  assert.equal(health.alive, true)
  assert.equal(health.current, 2)
  assert.equal(health.damage(2), true)
  assert.equal(health.damage(2), false)
})

test('reset restores the configured maximum after damage or death', () => {
  const health = new Health({ maximum: 25 })
  health.damage(10)
  health.reset()
  assert.equal(health.current, 25)
  health.damage(25)
  health.reset()
  assert.equal(health.current, 25)
  assert.equal(health.alive, true)
  assert.equal(health.damage(25), true)
})

test('zero maximum remains empty through healing and reset', () => {
  const health = new Health({ maximum: 0 })
  assert.equal(health.current, 0)
  assert.equal(health.alive, false)
  assert.equal(health.damage(1), false)
  health.heal(10)
  health.reset()
  assert.equal(health.current, 0)
  assert.equal(health.maximum, 0)
})

test('health rejects invalid maxima and amounts without changing its state', () => {
  const invalid = [-1, NaN, Infinity, -Infinity, '10', null, true, {}, undefined]
  for (const amount of invalid) {
    if (amount !== undefined)
      assert.throws(() => new Health({ maximum: amount }), RangeError)

    const health = new Health({ maximum: 40 })
    health.damage(15)
    assert.throws(() => health.damage(amount), RangeError)
    assert.throws(() => health.heal(amount), RangeError)
    assert.equal(health.current, 25)
    assert.equal(health.maximum, 40)
    assert.equal(health.alive, true)
  }
})

test('fractional amounts and large finite healing stay within the maximum', () => {
  const health = new Health({ maximum: 1.5 })
  health.damage(.5)
  health.heal(.25)
  assert.equal(health.current, 1.25)

  const large = new Health({ maximum: Number.MAX_VALUE })
  large.heal(Number.MAX_VALUE)
  assert.equal(large.current, Number.MAX_VALUE)
  assert.equal(Number.isFinite(large.current), true)
})

test('instances keep independent state and public reads cannot bypass the bounds', () => {
  const first = new Health({ maximum: 20 })
  const second = new Health({ maximum: 30 })
  first.damage(20)
  assert.equal(second.current, 30)
  assert.equal(second.alive, true)
  second.heal(100)
  assert.equal(first.current, 0)
  assert.throws(() => {
    first.current = -1
  }, TypeError)
  assert.throws(() => {
    first.maximum = Infinity
  }, TypeError)
  assert.equal(first.current, 0)
  assert.equal(first.maximum, 20)
})
