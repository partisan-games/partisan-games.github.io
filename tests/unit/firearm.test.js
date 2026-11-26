import { test } from 'node:test'
import assert from 'node:assert/strict'
import Firearm, { firearms } from '/core/gameplay/Firearm.js'
import TriggerKeys from '/core/gameplay/controllers/TriggerKeys.js'
import Character from '/core/gameplay/bodies/characters/Character.js'

const dt = 1 / 30

/** Shots fired over `seconds` with the trigger held, or pulled anew each frame it is `clicking`. */
const shots = (gun, seconds, clicking = false) => {
  let fired = 0
  for (let t = 0, frame = 0; t < seconds; t += dt, frame++)
    if (gun.pull(clicking ? frame % 2 === 0 : true, dt)) fired++
  return fired
}

test('a rifle fires once a pull, no faster than its bolt allows', () => {
  assert.equal(shots(new Firearm(firearms.rifle), 3), 1, 'held, it fires once')
  const fired = shots(new Firearm(firearms.rifle), 3, true)
  assert.equal(fired, Math.ceil(3 / firearms.rifle.repeat))
})

test('a machine gun fires while held, then reloads its empty magazine', () => {
  const { repeat, magazine, reload } = firearms.machineGun
  const gun = new Firearm(firearms.machineGun)
  assert.equal(shots(gun, magazine * repeat), magazine)
  assert.equal(gun.reloading, true)
  // the last shot left a repeat before the magazine ran out
  assert.equal(shots(gun, reload - repeat - .1), 0)
  assert.ok(shots(gun, .3) > 0, 'loaded again')
})

test('the player fires his gun the moment it allows, and takes up another one', () => {
  const body = new Character({ walks: false, actions: { attack: .1 } })
  const input = { attack: true }
  const keys = new TriggerKeys(body, input, new Firearm(firearms.rifle))
  keys.update(dt)
  assert.equal(body.state, 'attack')
  assert.equal(body.reach, firearms.rifle.reach)
  keys.equip(new Firearm(firearms.machineGun))
  assert.deepEqual(body.damage, firearms.machineGun.damage)
})

test('its readiness fills from a shot to the next, and through a reload', () => {
  const rifle = new Firearm(firearms.rifle)
  assert.equal(rifle.readiness, 1)
  rifle.pull(true, 0)
  rifle.pull(false, rifle.repeat / 2)
  assert.ok(Math.abs(rifle.readiness - .5) < 1e-9)
  rifle.pull(false, rifle.repeat / 2)
  assert.equal(rifle.readiness, 1)
  for (let shot = 1; shot < rifle.magazine; shot++) {
    rifle.pull(false, rifle.repeat)
    rifle.pull(true, 0)
  }
  assert.equal(rifle.reloading, true)
  rifle.pull(false, rifle.reload / 4)
  assert.ok(Math.abs(rifle.readiness - .25) < 1e-9)
})
