import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Color, Mesh, Scene } from 'three'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import ZombieWaves from '/scenes/graveyard-survival/ZombieWaves.js'
import AI from '/core3d/actor/AI.js'

before(() => createPageElements())

test('horror, worker and dead-tree descriptions and their three scenes import without fetching models', async t => {
  let requests = 0
  t.mock.method(globalThis, 'fetch', () => {
    requests++
    return Promise.reject(new Error('Import must not load models'))
  })
  for (const name of ['GothGirl', 'ZombieBarefoot', 'ZombieCop', 'ZombieDoctor', 'ZombieGuard', 'Ghost'])
    await import(`/core3d/actor/derived/horror/${name}.js`)
  await import('/core3d/actor/derived/ww2/Worker.js')
  await import('/core3d/objects/DeadTree.js')
  for (const name of ['graveyard-survival', 'graffiti-city', 'graffiti-city-maze'])
    await import(`/scenes/${name}/Main.js`)
  assert.equal(requests, 0)
})

test('zombies keep the ten-second growth rate, wait through pause and stop after the outcome', () => {
  const session = new GameSession()
  let count = 0
  const waves = new ZombieWaves({ session, spawn: () => count++ })
  session.start()
  session.update(9.9)
  waves.update()
  assert.equal(count, 0)
  session.pause()
  session.update(100)
  waves.update()
  assert.equal(count, 0)
  session.resume()
  session.update(.11)
  waves.update()
  assert.equal(count, 1)
  session.update(10)
  waves.update()
  assert.equal(count, 2)
  session.update(100)
  waves.update()
  assert.equal(count, 3, 'one new zombie, not ten behind a stalled frame')
  session.finish()
  session.update(100)
  waves.update()
  assert.equal(count, 3)
})

test('the ghost death without an animation uses the shared actor death exactly once', async() => {
  const { GhostAI } = await import('/core3d/actor/derived/horror/Ghost.js')
  let deaths = 0
  const actor = new AI({
    mesh: new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0)),
    baseState: 'idle', useComposedMovement: true, deathCallback: () => deaths++,
  })
  actor.damageAmount = 1000
  GhostAI.prototype.checkHit.call(actor)
  assert.equal(actor.dead, true)
  assert.equal(actor.state, 'death')
  assert.equal(deaths, 1)
  actor.damageAmount = 50
  GhostAI.prototype.checkHit.call(actor)
  assert.equal(deaths, 1)
})

test('graveyard keeps its morning victory and does not spawn behind the result screen', async() => {
  const { default: Graveyard } = await import('/scenes/graveyard-survival/Main.js')
  let spawns = 0
  let wins = 0
  const scene = {
    predmeti: [], ui: { outro: false }, player: { dead: false }, npcs: [],
    moon: new Mesh(new BoxGeometry()), scene: new Scene(),
    spawnZombie: () => spawns++, defeat() {},
    victory() {
      wins++
      this.ui.outro = true
    },
  }
  scene.scene.background = new Color(0x202030)
  Graveyard.prototype.update.call(scene, 1 / 60, 301)
  assert.equal(wins, 1)
  assert.equal(spawns, 0)
  Graveyard.prototype.update.call(scene, 1 / 60, 100)
  assert.equal(spawns, 0)
})
