import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Vehicle, drive, kinds

before(async() => {
  createPageElements()
  ;({ default: Vehicle, drive } = await import('/scenes/franjo-kluz/Vehicle.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
})

const vehicle = (kind, options = {}) =>
  new Vehicle({ ...kinds[kind], camera: { cameraX: 0, cameraY: 0 }, groundY: 700, x: 1000, ...options })

const live = (block, seconds) => {
  for (let i = 0; i < seconds * 30; i++) block.update(1 / 30)
}

test('a vehicle has the states idle, drive and dead, and starts standing with its engine running', () => {
  const truck = vehicle('truck')
  assert.deepEqual(truck.states, ['idle', 'drive', 'dead'])
  assert.equal(truck.state, 'idle')
  assert.equal(truck.pose, 'idle')
  live(truck, 2)
  assert.equal(truck.x, 1000, 'it stands')
})

test('a driving vehicle goes the way its picture faces, and the other way when mirrored', () => {
  for (const [kind, way] of [['truck', -1], ['tank', 1], ['train', -1]]) {
    const ahead = vehicle(kind)
    ahead.setState('drive')
    assert.equal(ahead.pose, 'drive')
    live(ahead, 2)
    assert.ok(Math.abs(ahead.x - (1000 + way * drive.speed * 2)) < 1e-9, `${kind} drives ${way}`)

    const mirrored = vehicle(kind, { mirrored: true })
    mirrored.setState('drive')
    live(mirrored, 2)
    assert.ok(Math.abs(mirrored.x - (1000 - way * drive.speed * 2)) < 1e-9, `a mirrored ${kind} drives back`)
  }
})

test('a vehicle set to dead stops where it is', () => {
  const tank = vehicle('tank')
  tank.setState('drive')
  live(tank, 1)
  tank.setState('dead')
  const { x } = tank
  live(tank, 2)
  assert.equal(tank.dead, true)
  assert.equal(tank.x, x)
})
