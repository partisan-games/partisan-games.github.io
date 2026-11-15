import { test } from 'node:test'
import assert from 'node:assert/strict'
import BoatCamera from '/scenes/camac/BoatCamera.js'

test('initial thrust holds the starting frame; later thrust only recovers the distance drifted left', () => {
  const camera = new BoatCamera()
  const initial = camera.screenX(1000, 180)
  camera.update(1, false, false)
  assert.equal(camera.screenX(1000, 180), initial, 'before traveling, idle framing stays still')
  for (let i = 0; i < 2400; i++) camera.update(1 / 60, true)
  assert.equal(camera.screenX(1000, 180), initial, 'first throttle never moves right of the start')
  camera.update(.1, false)
  assert.ok(camera.screenX(1000, 180) < initial)
  assert.ok(initial - camera.screenX(1000, 180) < 10, 'release remains gradual')
  for (let i = 0; i < 2400; i++) camera.update(1 / 60, false)
  const left = camera.screenX(1000, 180)
  camera.update(.1, true)
  assert.ok(camera.screenX(1000, 180) > left)
  assert.ok(camera.screenX(1000, 180) < initial)
  for (let i = 0; i < 2400; i++) {
    camera.update(1 / 60, true)
    assert.ok(camera.screenX(1000, 180) <= initial)
  }
  assert.ok(Math.abs(camera.screenX(1000, 180) - initial) < .001)
})

test('camera easing depends on elapsed time and keeps the whole hull inside narrow viewports', () => {
  const slow = new BoatCamera(), fast = new BoatCamera()
  for (let i = 0; i < 30; i++) slow.update(1 / 30, false)
  for (let i = 0; i < 144; i++) fast.update(1 / 144, false)
  assert.ok(Math.abs(slow.screenX(1000, 180) - fast.screenX(1000, 180)) < 1e-8)
  const camera = new BoatCamera()
  for (const width of [300, 600, 1200]) {
    const x = camera.screenX(width, 180)
    assert.ok(x - 90 >= 16 && x + 90 <= width - 16)
  }
  const x = camera.screenX(600, 180)
  camera.update(0, true)
  assert.equal(camera.screenX(600, 180), x)
})
