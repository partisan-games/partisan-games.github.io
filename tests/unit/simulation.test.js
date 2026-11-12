import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'
import FixedStep from '/core/runtime/FixedStep.js'
import UpdateRegistry from '/core/runtime/UpdateRegistry.js'

let Scena

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
})

const near = (a, b) => Math.abs(a - b) < 1e-9

/** Steps run by frames of the given lengths. */
const stepsFor = (stepper, frames) => frames.reduce((sum, dt) => sum + stepper.advance(dt), 0)

test('the same game time gives the same steps at 30, 60 and 120 frames per second', () => {
  for (const fps of [30, 60, 120]) {
    const stepper = new FixedStep()
    assert.equal(stepsFor(stepper, Array(fps * 1.5).fill(1 / fps)), 90, `${fps} fps`)
    assert.equal(stepper.dropped, 0)
  }
})

test('after a stall the steps are limited and the rest is dropped, not made up later', () => {
  const stepper = new FixedStep()
  const frames = [...Array(30).fill(1 / 60), .5, ...Array(30).fill(1 / 60)]
  assert.equal(stepsFor(stepper, frames), 65)
  assert.ok(near(stepper.dropped, .5 - 5 / 60), `dropped ${stepper.dropped}`)
})

test('time from before a pause is not owed after it', () => {
  const stepper = new FixedStep()
  stepper.advance(1 / 120)
  stepper.reset()
  assert.equal(stepper.advance(1 / 120), 0)
  assert.equal(stepper.advance(1 / 120), 1)
})

const counter = (log, name) => ({ update: () => log.push(name) })

test('the registry updates an object once per step, however often it was added', () => {
  const registry = new UpdateRegistry()
  const log = []
  const parent = counter(log, 'parent')
  const child = counter(log, 'child')
  registry.add(parent, child, child)
  registry.add(parent)

  registry.step(1 / 60)
  assert.deepEqual(log, ['parent', 'child'])
})

test('an object added during a step joins from the next one; a removed one stops at once', () => {
  const registry = new UpdateRegistry()
  const log = []
  const spawned = counter(log, 'spawned')
  const target = counter(log, 'target')
  const shooter = { update: () => {
    log.push('shooter')
    registry.add(spawned)
    registry.remove(target)
    assert.equal(registry.has(target), false, 'a removed target cannot be hit again in the same step')
  } }
  registry.add(shooter, target)

  registry.step(1 / 60)
  assert.deepEqual(log, ['shooter'])
  log.length = 0
  registry.step(1 / 60)
  assert.deepEqual(log, ['shooter', 'spawned'])
  assert.equal(registry.has(target), false)
})

test('a fixed-step scene reads input and draws once per frame, and runs the rules once per step', () => {
  const frames = installFakeFrames()
  const scene = new Scena({ canvas: document.createElement('canvas'), fixedStep: true })
  const counts = { input: 0, steps: 0, present: 0, updates: 0 }
  scene.add({ alive: true, handleInput: () => counts.input++, update: () => counts.updates++ })
  scene.fixedUpdate = () => counts.steps++
  scene.present = () => counts.present++
  scene.start()

  frames.step() // the first frame only sets the start time
  frames.step(1000 / 20) // three steps in one drawn frame
  assert.deepEqual(counts, { input: 2, steps: 3, present: 2, updates: 3 })

  scene.pause()
  frames.step(5000)
  scene.unpause()
  frames.step(1000 / 20) // the first frame after a pause starts the time again
  assert.equal(counts.steps, 3)
  scene.end()
})

test('a scene without fixedStep keeps its loop: one update per frame through the object tree', () => {
  const frames = installFakeFrames()
  const scene = new Scena({ canvas: document.createElement('canvas') })
  let childUpdates = 0
  scene.add({ update() {}, predmeti: [{ update: () => childUpdates++ }] })
  scene.start()
  frames.step()
  frames.step(1000 / 20)
  assert.equal(childUpdates, 2)
  assert.equal(scene.simulation, undefined)
  scene.end()
})
