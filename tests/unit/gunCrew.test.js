import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let GunCrew, Flak, FlakSprite, AntiTankGun, AntiTankGunSprite, sideProjection, GameSession
before(async() => {
  createPageElements()
  GunCrew = (await import('/core/actor/artillery/GunCrew.js')).default
  Flak = (await import('/core/gameplay/bodies/artillery/Flak.js')).default
  FlakSprite = (await import('/core/actor/artillery/FlakSprite.js')).default
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  AntiTankGun = (await import('/core/gameplay/bodies/artillery/AntiTankGun.js')).default
  AntiTankGunSprite = (await import('/core/actor/artillery/AntiTankGunSprite.js')).default
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

test('the crews of the Flak and the PaK work only on a real shot, and fall with their gun', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const gun = new Flak({ clock: session.clock, x: 10, y: 2 })
  const view = new FlakSprite(gun, { projection: sideProjection({ pxPerMeter: 22, groundY: 500 }), camera: { cameraX: 0, cameraY: 0 } })
  gun.aimAt({ x: 0, y: 30 })
  gun.reload.start(0)
  gun.trainBarrel(10)
  gun.fire()
  view.update(0)
  assert.equal(view.crew.name, 'fire')
  view.update(.21)
  gun.fire()
  view.update(0)
  assert.equal(view.crew.frameIndex, 1, 'reload cannot restart the crew action')
  const pak = new AntiTankGun({ clock: session.clock, x: 30, y: .73, yaw: Math.PI })
  const pakView = new AntiTankGunSprite(pak, { projection: sideProjection({ pxPerMeter: 20, groundY: 500 }) })
  pakView.update(.2)
  assert.equal(pakView.crew.name, 'idle')
  pak.aimAt({ x: 10, y: 1 })
  session.update(2)
  assert.equal(pak.shoot(), true)
  pakView.update(.2)
  assert.equal(pakView.crew.name, 'fire')
  pak.setState('dead')
  pakView.update(.2)
  assert.equal(pakView.crew.name, 'death')
})
