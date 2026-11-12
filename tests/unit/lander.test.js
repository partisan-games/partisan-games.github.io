import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh } from 'three'
import { createPageElements } from './helpers/dom.js'
import FixedStep from '/core/runtime/FixedStep.js'

let Lander, landerModel, loadedModel

before(async() => {
  createPageElements()
  ;({ default: Lander, model: landerModel } = await import('/scenes/moon-landing/Lander.js'))
  ;({ loadedModel } = await import('/core3d/assets/models.js'))
})

/** A lander far above a platform it cannot reach, so only gravity and thrust move it. */
function createLander(t) {
  const platform = { playerOnPlatform: false, position: { y: -1000 } }
  const lander = new Lander({ platform, mesh: new Mesh(new BoxGeometry(1, 1, 1)) })
  t.after(() => lander.end())
  return lander
}

/** Plays the lander as the moon-landing scene does: in fixed steps, whatever the refresh rate. */
function fall(lander, seconds, fps) {
  const stepper = new FixedStep()
  for (let i = 0; i < seconds * fps; i++)
    for (let steps = stepper.advance(1 / fps); steps > 0; steps--) lander.update(stepper.step, 0)
  return lander.position.y
}

test('importing the lander loads no model', () => {
  assert.throws(() => loadedModel(landerModel), /before it has loaded/)
})

test('the lander falls the same at 60 and at 120 frames per second, about as it did at 30', t => {
  const at60 = fall(createLander(t), 2, 60)
  const at120 = fall(createLander(t), 2, 120)
  assert.ok(Math.abs(at60 - at120) < 1e-9, `${at60} and ${at120}`)

  const original = createLander(t) // one update per drawn frame at 30, where it was tuned
  for (let i = 0; i < 60; i++) original.update(1 / 30, 0)
  const fallen = 5 - at60, originallyFallen = 5 - original.position.y
  assert.ok(Math.abs(fallen - originallyFallen) / originallyFallen < .05, `${fallen} and ${originallyFallen}`)
})
