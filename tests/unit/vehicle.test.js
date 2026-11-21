import { test } from 'node:test'
import assert from 'node:assert/strict'
import Vehicle, { vehicleKinds } from '/core/gameplay/bodies/vehicles/Vehicle.js'

test('a vehicle stands, drives the way it faces at its speed, and stops where it is destroyed', () => {
  for (const [yaw, way] of [[0, 1], [Math.PI, -1]]) {
    const vehicle = new Vehicle({ kind: vehicleKinds.truck, x: 10, yaw })
    assert.deepEqual(vehicle.states, ['idle', 'drive', 'dead'])
    vehicle.update(1)
    assert.equal(vehicle.x, 10)
    vehicle.setState('drive')
    for (let i = 0; i < 30; i++) vehicle.update(1 / 30)
    assert.ok(Math.abs(vehicle.x - (10 + way * vehicleKinds.truck.speed)) < 1e-9)
    vehicle.setState('dead')
    const { x } = vehicle
    vehicle.update(1)
    assert.equal(vehicle.x, x)
    assert.equal(vehicle.alive, false)
  }
})

test('a truck falls to a few bullets, the armoured train only to many', () => {
  const hitsToDestroy = kind => {
    const vehicle = new Vehicle({ kind })
    let hits = 0
    while (vehicle.alive) {
      vehicle.takeHit(15)
      hits++
    }
    return hits
  }
  assert.ok(hitsToDestroy(vehicleKinds.truck) <= 3)
  assert.ok(hitsToDestroy(vehicleKinds.train) > 10)
})
