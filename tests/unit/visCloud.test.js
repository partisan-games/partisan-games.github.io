import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

before(() => {
  createPageElements()
})

test('a cloud drifts down a little faster or slower than the scenery, and a little sideways', async() => {
  const { default: Cloud2D } = await import('/scenes/vis/Oblak.js')
  for (let i = 0; i < 20; i++) {
    const cloud = new Cloud2D(100)
    assert.ok(cloud.dy >= 75 && cloud.dy <= 125)
    assert.ok(Math.abs(cloud.dx) <= 5)
  }
})
