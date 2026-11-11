import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { installFakeFrames } from './helpers/frames.js'
import GameLoop from '/core/GameLoop.js'

let frames, calls, loop

beforeEach(() => {
  frames = installFakeFrames()
  calls = []
  loop = new GameLoop((dt, t) => calls.push({ dt, t }))
})

test('stop after several frames leaves no frame scheduled', () => {
  loop.start()
  frames.step()
  frames.step()
  frames.step()
  loop.stop()

  assert.equal(frames.pending, 0)
  assert.equal(loop.isRunning, false)
})

test('start after stop runs exactly one loop with the scene callback', () => {
  loop.start()
  frames.step()
  loop.stop()
  calls = []

  loop.start()
  frames.step()
  frames.step()

  assert.equal(frames.pending, 1)
  assert.equal(calls.length, 2)
})

test('pause skips the scene and unpause does not jump in time', () => {
  loop.start()
  frames.step(16)
  frames.step(16)
  loop.pause()
  frames.step(1000)
  frames.step(1000)
  assert.equal(calls.length, 2)

  loop.unpause()
  frames.step(16)
  frames.step(16)

  assert.equal(calls.length, 4)
  assert.equal(calls[2].dt, 0)
  assert.equal(calls[3].dt, 0.016)
})

test('stopTime freezes game time while the loop goes on', () => {
  loop.start()
  frames.step(16)
  frames.step(16)
  loop.stopTime()
  frames.step(16)
  const frozen = calls.at(-1).t
  frames.step(16)
  assert.equal(calls.at(-1).t, frozen)
})

test('a scene that stops the loop during its frame schedules nothing more', () => {
  loop = new GameLoop(() => loop.stop())
  loop.start()
  frames.step()

  assert.equal(frames.pending, 0)
})
