import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import RoadVehicle, { roadVehicleKinds } from '/core/gameplay/bodies/vehicles/RoadVehicle.js'
import GameClock from '/core/runtime/GameClock.js'
import { collisionRank } from '/core/gameplay/VehicleCollisions.js'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

test('all seven road vehicles drive both ways, stop dead, and use shared collision data', () => {
  assert.equal(Object.keys(roadVehicleKinds).length, 7)
  for (const kind of Object.values(roadVehicleKinds)) for (const yaw of [0, Math.PI]) {
    const body = new RoadVehicle({ kind, clock: new GameClock(), yaw })
    assert.ok(collisionRank(body.physical), kind.name)
    body.setState('move')
    body.update(1)
    assert.equal(body.x, body.forward * kind.speed)
    body.setState('dead')
    const { x } = body
    body.update(2)
    assert.equal(body.x, x)
    body.setState('move')
    assert.equal(body.state, 'dead')
  }
})

test('armed vehicles launch at their muzzle, actually damage targets, and cannot fire during pause', () => {
  for (const kind of Object.values(roadVehicleKinds)) for (const yaw of [0, Math.PI]) {
    const clock = new GameClock()
    const body = new RoadVehicle({ kind, clock, yaw })
    assert.equal(body.states.includes('attack'), kind.armed)
    if (!kind.armed) {
      assert.equal(body.shoot(), false)
      continue
    }
    const target = new RoadVehicle({ kind, clock, x: body.forward * 12, y: 0 })
    body.targets.push(target)
    body.aimAt(target)
    clock.advance(2)
    const { muzzle } = body
    assert.equal(body.shoot(), true)
    const shell = body.shells.projectiles[0]
    assert.deepEqual([shell.x, shell.y, shell.z], [muzzle.x, muzzle.y, muzzle.z])
    for (let i = 0; i < 60; i++) body.update(1 / 60)
    assert.ok(target.health.current < target.health.maximum, kind.name)
    assert.equal(body.shoot(), false, 'cooldown uses the game clock')
    body.canFire = () => false
    clock.advance(10)
    assert.equal(body.shoot(), false)
  }
})

test('native sources cover natural size and wrecks hold their last frame without changing the body', async() => {
  createPageElements()
  const { default: RoadVehicleSprite, roadVehicleArt } = await import('/core/actor/vehicles/RoadVehicleSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const manifest = JSON.parse(readFileSync(new URL('../../assets/images/armies/sources/road-vehicles/sprites.json', import.meta.url)))
  assert.equal(manifest.assets.length, 7)
  for (const [id, kind] of Object.entries(roadVehicleKinds)) {
    const record = manifest.assets.find(item => item.id === id)
    assert.ok(record.scale <= 1)
    const art = roadVehicleArt[id]
    assert.ok(art.bounds[2] - art.bounds[0] >= kind.size.length * 40)
    assert.ok(art.bounds[3] - art.bounds[1] >= kind.size.height * 40)
    const body = new RoadVehicle({ kind, clock: new GameClock() })
    const view = new RoadVehicleSprite(body, { id, projection: sideProjection({ pxPerMeter: 40, groundY: 300 }) })
    if (kind.armed) for (const yaw of [0, Math.PI]) {
      body.yaw = yaw
      view.fit()
      const [left, top, right, bottom] = art.bounds
      const x = (art.muzzlePoint[0] - (left + right) / 2) * view.width / (right - left) * view.flipY
      const y = (art.muzzlePoint[1] - (top + bottom) / 2) * view.height / (bottom - top)
      const muzzle = view.projection.point(body.muzzle)
      assert.ok(Math.hypot(view.x + x - muzzle.x, view.y + y - muzzle.y) < 1e-8, id)
    }
    loadAtlas(view.sheet, art.width * 4, art.height * 5)
    const size = { ...body.size }
    body.takeHit(body.health.maximum)
    body.update(10)
    assert.deepEqual(view.sheet.sample('dead', body.stateTime), { row: 4, frame: 3 })
    assert.deepEqual(body.size, size)
    const clock = new GameClock()
    const fresh = new RoadVehicle({ kind, clock })
    assert.equal(fresh.alive, true)
    assert.equal(fresh.shotsFired, 0)
  }
})
