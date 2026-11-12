import { test } from 'node:test'
import assert from 'node:assert/strict'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'

const createClock = () => ({ now: 0 })

function createWeapon({ seconds = 1, barrels } = {}) {
  const clock = createClock()
  const shots = []
  const weapon = new Weapon({
    cooldown: new Cooldown({ seconds, clock }),
    spawnProjectile: (origin, direction) => shots.push({ origin, direction }),
    barrels,
  })
  return { clock, shots, weapon }
}

test('the first shot fires at once, the next one only after the reload', () => {
  const { clock, shots, weapon } = createWeapon()
  const origin = { x: 1, y: 2 }

  assert.equal(weapon.tryFire(origin, 0), true)
  clock.now = .99
  assert.equal(weapon.tryFire(origin, 0), false)
  clock.now = 1
  assert.equal(weapon.tryFire(origin, .5), true)
  assert.deepEqual(shots, [{ origin, direction: 0 }, { origin, direction: .5 }])
})

test('a rejected shot does not restart the reload', () => {
  const { clock, weapon } = createWeapon()
  weapon.tryFire({ x: 0, y: 0 }, 0)
  clock.now = .5
  weapon.tryFire({ x: 0, y: 0 }, 0)
  clock.now = 1
  assert.equal(weapon.tryFire({ x: 0, y: 0 }, 0), true)
})

test('every barrel fires in one accepted shot, each at its own angle and place', () => {
  const { shots, weapon } = createWeapon({ barrels: [{ angle: -.3 }, { x: -12 }, { x: 12, y: 2, angle: .3 }] })
  assert.equal(weapon.tryFire({ x: 100, y: 50 }, 1), true)
  assert.equal(weapon.tryFire({ x: 100, y: 50 }, 1), false)
  assert.deepEqual(shots, [
    { origin: { x: 100, y: 50 }, direction: .7 },
    { origin: { x: 88, y: 50 }, direction: 1 },
    { origin: { x: 112, y: 52 }, direction: 1.3 },
  ])
})

test('a cooldown can wait a different time once, and then waits its usual time again', () => {
  const clock = createClock()
  const cooldown = new Cooldown({ seconds: 1, clock })
  cooldown.start(.25)
  clock.now = .25
  assert.ok(cooldown.ready)
  cooldown.start()
  clock.now = 1
  assert.ok(!cooldown.ready)
})

test('the reload waits while the clock stands still, as a game clock does in a pause', () => {
  const { weapon } = createWeapon()
  weapon.tryFire({ x: 0, y: 0 }, 0)
  for (let i = 0; i < 100; i++) assert.equal(weapon.tryFire({ x: 0, y: 0 }, 0), false)
})

test('a cooldown refuses an invalid wait', () => {
  assert.throws(() => new Cooldown({ seconds: -1, clock: createClock() }), RangeError)
  assert.throws(() => new Cooldown({ seconds: NaN, clock: createClock() }), RangeError)
})
