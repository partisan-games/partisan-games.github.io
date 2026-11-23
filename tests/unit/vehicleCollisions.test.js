import { test } from 'node:test'
import assert from 'node:assert/strict'
import VehicleCollisions, { collisionDamage, collisionRank } from '/core/gameplay/VehicleCollisions.js'
import { modelStatistics as stats } from '/core/gameplay/modelStatistics.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import Tank, { tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import Vehicle, { vehicleKinds } from '/core/gameplay/bodies/vehicles/Vehicle.js'
import GunCarrier, { gunCarrierKinds } from '/core/gameplay/bodies/vehicles/GunCarrier.js'
import GameClock from '/core/runtime/GameClock.js'

function pair(model = 'tiger-i') {
  const clock = new GameClock()
  const driver = new Tank({ clock, x: 0, random: () => 1 })
  const other = new Tank({ clock, x: 10, yaw: Math.PI, performance: modelPerformance[model], random: () => 1 })
  driver.vx = 8
  other.vx = -4
  return { driver, other, contacts: new VehicleCollisions(driver) }
}

test('bodies share the physical model, including performance variants with a shared drawing', () => {
  const clock = new GameClock()
  assert.equal(new Tank({ clock }).physical, stats.partisanTank)
  assert.equal(new Tank({ clock, kind: tankKinds.german }).physical, stats['tiger-i'])
  assert.equal(new Tank({ clock, performance: modelPerformance['m15-42'] }).physical, stats['m15-42'])
  assert.equal(new Vehicle({ kind: vehicleKinds.truck }).physical, stats['opel-blitz'])
  assert.equal(new GunCarrier({ clock, kind: gunCarrierKinds.halftrack }).physical, stats['sdkfz-251'])
  assert.equal(new Vehicle({ kind: vehicleKinds.train }).physical, undefined, 'unknown models do not inherit an invented mass')
})

test('physical masses give four collision ranks; damage scales with speed and the opponent mass', () => {
  assert.deepEqual(['bmw-r75', 'opel-blitz', 'sdkfz-222', 'sdkfz-251', 'somua-s35', 'tiger-i']
    .map(id => collisionRank(stats[id])), [1, 1, 2, 2, 3, 4])
  const damage = id => collisionDamage(stats.partisanTank, stats[id], 12).first
  assert.ok(damage('bmw-r75') < damage('opel-blitz'))
  assert.ok(damage('opel-blitz') < damage('sdkfz-251'))
  assert.ok(damage('sdkfz-251') < damage('somua-s35'))
  assert.ok(damage('somua-s35') < damage('tiger-i'))
  const slow = collisionDamage(stats.partisanTank, stats['tiger-i'], 6)
  assert.equal(slow.first * 4, damage('tiger-i'))
  const reverse = collisionDamage(stats['tiger-i'], stats.partisanTank, 6)
  assert.equal(slow.first, reverse.second)
  assert.equal(slow.second, reverse.first)
  assert.equal(collisionDamage(undefined, stats['tiger-i'], 12), null)
  assert.equal(collisionDamage(stats.partisanTank, stats['tiger-i'], 0), null)
})

test('a heavy tank crushes soft and light armored vehicles, but not another tank', () => {
  for (const id of ['bmw-r75', 'opel-blitz', 'sdkfz-222', 'sdkfz-251', 'pak-38']) {
    const { driver, other, contacts } = pair()
    other.physical = stats[id]
    other.health.reset()
    contacts.capture([other])
    driver.x = 8
    other.x = 6
    contacts.resolve([other], 1)
    assert.ok(other.dead, id)
    assert.ok(driver.alive, id)
    assert.ok(driver.health.current > driver.health.maximum * .8, id)
    assert.equal(contacts.blocked, false)
  }
  assert.equal(collisionDamage(stats.partisanTank, stats['somua-s35'], 12).crushSecond, false)
})

test('head-on contact stops both tanks and damages once until they separate', () => {
  const { driver, other, contacts } = pair()
  contacts.capture([other])
  driver.x = 8
  other.x = 6
  contacts.resolve([other], 1)
  assert.ok(driver.alive && other.alive)
  assert.ok(driver.health.current < driver.health.maximum * .5, 'a Tiger inflicts substantial damage')
  assert.equal(driver.vx, 0)
  assert.equal(other.vx, 0)
  assert.equal(contacts.blocked, true)
  assert.equal(other.x - driver.x, (other.size.length + driver.size.length) / 2)
  const health = driver.health.current
  for (let i = 0; i < 20; i++) {
    contacts.capture([other])
    driver.x += .01
    other.x -= .01
    contacts.resolve([other], 1 / 60)
  }
  assert.equal(driver.health.current, health)
  contacts.capture([other])
  driver.x -= 1
  contacts.resolve([other], .1)
  assert.equal(contacts.blocked, false, 'the driver can reverse out of contact')
  other.takeHit(other.health.maximum)
  assert.equal(contacts.blocked, false)
})

test('swept contacts stop a large-step pass-through and ignore other lanes, wrecks and a zero time step', () => {
  const { driver, other, contacts } = pair()
  other.x = 20
  contacts.capture([other])
  driver.x = 30
  other.x = 0
  contacts.resolve([other], 5)
  assert.ok(driver.x < other.x, 'vehicles cannot cross between frames')
  assert.equal(contacts.blocked, true)
  const health = driver.health.current
  contacts.capture([other])
  contacts.resolve([other], 0)
  assert.equal(driver.health.current, health)
  other.z = 10
  contacts.capture([other])
  contacts.resolve([other], .1)
  assert.equal(contacts.blocked, false)
  other.z = 0
  other.setState('dead')
  contacts.capture([other])
  driver.x = other.x
  contacts.resolve([other], .1)
  assert.equal(driver.health.current, health)
})

test('stationary contact does no damage and unknown physical models do not block known vehicles', () => {
  const { driver, other, contacts } = pair()
  driver.vx = other.vx = 0
  other.x = (driver.size.length + other.size.length) / 2
  contacts.capture([other])
  contacts.resolve([other], .1)
  assert.equal(driver.health.current, driver.health.maximum)
  assert.equal(other.health.current, other.health.maximum)
  driver.physical = undefined
  contacts.capture([other])
  contacts.resolve([other], .1)
  assert.equal(contacts.blocked, false)
})

test('the same approach at different frame rates gives the same impact and stops at contact', () => {
  const run = fps => {
    const { driver, other, contacts } = pair()
    other.x = 20
    for (let i = 0; i < fps * 2 && !contacts.blocked; i++) {
      contacts.capture([other])
      driver.x += 8 / fps
      other.x -= 4 / fps
      contacts.resolve([other], 1 / fps)
    }
    assert.equal(contacts.blocked, true)
    return [driver.health.current, other.health.current, driver.x, other.x]
  }
  const baseline = run(30)
  for (const fps of [60, 144]) run(fps).forEach((value, i) => assert.ok(Math.abs(value - baseline[i]) < 1e-8))
})
