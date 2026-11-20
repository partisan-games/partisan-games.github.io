import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Otpisani

before(async() => {
  createPageElements()
  ;({ default: Otpisani } = await import('/scenes/otpisani/Main.js'))
})

test('an occupier walks in from an edge for a while, then fires at the player until he is shot', t => {
  const scene = new Otpisani()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const [occupier] = scene.children
  assert.ok([0, scene.width].includes(occupier.x))
  assert.equal(occupier.forward, occupier.x === 0 ? 1 : -1, 'he walks into the view')
  const { walkTime } = scene.walks.get(occupier)
  scene.update(walkTime - .05, 0)
  assert.equal(occupier.state, 'walk')
  scene.update(.1, 0)
  assert.equal(occupier.state, 'fire')
  scene.update(1, 0)
  assert.ok(scene.energija < 100)
  occupier.die()
  const health = scene.energija
  scene.update(1, 0)
  assert.equal(scene.energija, health)
})
