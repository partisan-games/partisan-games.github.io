import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let GunCrew, Flak, GroundEnemy, profiles, groundEnemyArt, GameSession
before(async() => {
  createPageElements()
  GunCrew = (await import('/core/actor/artillery/GunCrew.js')).default
  Flak = (await import('/core/actor/artillery/Flak.js')).default
  ;({ GroundEnemy, profiles } = await import('/scenes/to-trieste/GroundEnemies.js'))
  ;({ groundEnemyArt } = await import('/scenes/to-trieste/enemyArt.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
})

test('both crews work on a shot, hold a pause and settle once, then reset with the revived gun', () => {
  for (const key of ['flak38', 'pak38']) {
    const crew = new GunCrew(key)
    crew.update(10, false)
    assert.equal(crew.name, 'idle')
    crew.fire()
    crew.update(.21, false)
    assert.equal(crew.frameIndex, 1)
    crew.update(0, false)
    assert.equal(crew.frameIndex, 1)
    crew.update(1, false)
    assert.equal(crew.name, 'idle')
    crew.update(.2, true)
    assert.equal(crew.name, 'death')
    crew.update(10, true)
    assert.equal(crew.frameIndex, 3)
    crew.fire()
    assert.equal(crew.name, 'death')
    crew.update(0, false)
    assert.equal(crew.name, 'idle')
  }
})

test('real Flak and PaK trigger the work clip only when their weapon accepts a shot', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const gun = new Flak({ session, camera: { cameraX: 0, cameraY: 0 }, groundY: 500, x: 200 })
  gun.y = 450
  gun.aimAt({ x: 100, y: 100 })
  gun.cooldown.start(0)
  gun.trainBarrel(10)
  gun.fire()
  assert.equal(gun.crew.name, 'fire')
  gun.crew.update(.21, false)
  gun.fire()
  assert.equal(gun.crew.frameIndex, 1, 'reload cannot restart the crew action')
  const pak = new GroundEnemy({ ...profiles.find(p => p.kind === 'antiTankGun'),
    art: groundEnemyArt.antiTankGun, clock: session.clock, target: { x: 0, y: 300 }, obstacles: [],
    groundY: 300, x: 300, scrollSpeed: -160, nextSpawnX: () => 2000 })
  t.mock.method(pak.fire, 'update', () => false)
  pak.update(.2)
  assert.equal(pak.crew.name, 'idle')
  pak.fire.update.mock.restore()
  t.mock.method(pak.fire, 'update', () => true)
  pak.update(.2)
  assert.equal(pak.crew.name, 'fire')
  pak.die()
  assert.equal(pak.crew.name, 'death')
  pak.reset()
  assert.equal(pak.crew.name, 'idle')
})
