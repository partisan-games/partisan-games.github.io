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
  const [{ body: occupier, view }] = scene.occupiers
  assert.ok([0, scene.width].includes(view.x))
  assert.equal(occupier.forward, view.x === 0 ? 1 : -1, 'he walks into the view')
  const { walkTime } = scene.walks.get(occupier)
  scene.update(walkTime - .05, 0)
  assert.equal(occupier.state, 'move')
  scene.update(.1, 0)
  assert.equal(occupier.state, 'attack')
  scene.update(1, 0)
  assert.ok(scene.energija < 100)
  // the dead fire no more; one who came in meanwhile falls too, before he could fire
  for (const { body } of scene.occupiers) body.setState('dead')
  const health = scene.energija
  scene.update(1, 0)
  assert.equal(scene.energija, health)
})

test('unselected catalogue candidates never enter the level through the spawn path', async t => {
  const { default: OccupierSprite } = await import('/core/actor/soldiers/OccupierSprite.js')
  const scene = new Otpisani()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.dodajNeprijatelja()
  scene.dodajNeprijatelja()
  scene.dodajNeprijatelja()
  for (const { view } of scene.occupiers) assert.ok(view instanceof OccupierSprite)
  assert.equal(scene.walks.size, 4)
})
