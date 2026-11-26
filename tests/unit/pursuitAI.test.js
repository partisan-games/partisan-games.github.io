import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character from '/core/gameplay/bodies/characters/Character.js'
import PursuitAI from '/core/gameplay/controllers/PursuitAI.js'
import CampNavigation from '/scenes/crveni-krst/CampNavigation.js'

function setup({ isBlocked = () => false, sees = () => true } = {}) {
  const target = new Character({ x: 8 })
  const body = new Character({ reach: 1, isBlocked })
  const candidates = [target]
  const guard = new PursuitAI(body, { target, candidates, sees, navigation: new CampNavigation(isBlocked), random: () => 0 })
  body.face(target)
  return { body, target, candidates, guard }
}

function play(guard, body, seconds, fps = 30) {
  for (let frame = 0; frame < Math.round(seconds * fps); frame++) {
    guard.update(1 / fps)
    body.update(1 / fps)
  }
}

test('shared pursuit accepts another world navigation and searches outside the camp bounds', () => {
  const body = new Character({ x: 500, z: 500, reach: 1 })
  const target = new Character({ x: 508, z: 500 })
  let visible = true, routes = 0
  const navigation = {
    route: (from, to) => {
      routes++
      return [{ x: to.x, z: to.z }]
    },
    clear: () => true,
  }
  const guard = new PursuitAI(body, { target, navigation, sees: () => visible, random: () => 0 })
  guard.update(.1)
  visible = false
  target.z = 520
  play(guard, body, 2)
  assert.equal(guard.doing, 'search')
  assert.ok(routes > 0)
  assert.ok(Math.hypot(body.x - 508, body.z - 500) < .6)
  assert.equal(body.shotsFired, 0)
  play(guard, body, 2.1)
  assert.equal(guard.doing, 'wander')
})

test('a guard investigates a snapshot of the last sighting, looks around and gives up without tracking the hidden target', () => {
  for (const fps of [30, 120]) {
    let visible = true
    const { body, target, guard } = setup({ sees: () => visible })
    guard.update(.1)
    assert.equal(guard.doing, 'pursue')
    visible = false
    target.x = -12
    target.z = 10
    guard.update(.1)
    assert.equal(guard.doing, 'search')
    assert.equal(guard.lastSeen.x, 8)
    assert.equal(guard.lastSeen.z, 0)
    play(guard, body, 2, fps)
    assert.ok(Math.hypot(body.x - 8, body.z) < .6, 'he reaches the remembered spot, not the new hidden position')
    assert.equal(body.moving, false)
    const { yaw } = body
    play(guard, body, .3, fps)
    assert.notEqual(body.yaw, yaw, 'he checks the surroundings instead of freezing')
    play(guard, body, 2, fps)
    assert.equal(guard.doing, 'wander')
    assert.equal(guard.lastSeen, null)
    assert.equal(body.shotsFired, 0, 'searching never fires at unseen coordinates')
  }
})

test('a guard uses the real navigation to go around a visible wire barrier before attacking', () => {
  const isBlocked = (from, direction, distance) => {
    if (!direction.x) return false
    const crossing = (2 - from.x) / direction.x
    return crossing >= 0 && crossing < distance && Math.abs(from.z + direction.z * crossing) < 2
  }
  const { body, target, guard } = setup({ isBlocked })
  let detoured = false
  for (let frame = 0; frame < 240 && !body.shotsFired; frame++) {
    guard.update(1 / 30)
    body.update(1 / 30)
    detoured ||= Math.abs(body.z) >= 2
  }
  assert.equal(detoured, true)
  assert.ok(body.x > 6)
  assert.ok(target.health.current < 100, 'the guard reaches firing range after finding the passage')
})

test('small distance changes keep the current target, but a much closer threat or a dead target changes it', () => {
  const { body, target, candidates, guard } = setup()
  target.x = 6
  const other = new Character({ x: 6.1 })
  candidates.push(other)
  guard.update(.1)
  assert.equal(guard.target, target)
  other.x = 5.9
  guard.update(.1)
  assert.equal(guard.target, target)
  other.x = 3
  guard.update(.1)
  assert.equal(guard.target, other)
  other.takeHit(1000)
  guard.update(.1)
  assert.equal(guard.target, target)
  assert.equal(guard.lastSeen.target, target)
  assert.equal(body.targets, candidates)
})

test('an unseen target with no previous sighting does not create a search', () => {
  const { guard } = setup({ sees: () => false })
  guard.update(.1)
  assert.equal(guard.doing, 'wander')
  assert.equal(guard.lastSeen, null)
})

test('a visible alternative replaces a lost target instead of being ignored during the search', () => {
  let hidden = null
  const { target, candidates, guard } = setup({ sees: (from, to) => to !== hidden })
  const other = new Character({ x: 9 })
  candidates.push(other)
  guard.update(.1)
  assert.equal(guard.target, target)
  hidden = target
  guard.update(.1)
  assert.equal(guard.target, other)
  assert.equal(guard.lastSeen.target, other)
  assert.equal(guard.doing, 'pursue')
})

test('an unreachable remembered location expires instead of creating an endless search', () => {
  let visible = true
  const { body, guard } = setup({ isBlocked: () => true, sees: () => visible })
  guard.update(.1)
  visible = false
  play(guard, body, 1)
  assert.equal(guard.doing, 'search')
  assert.equal(body.moving, false)
  play(guard, body, 12)
  assert.equal(guard.doing, 'wander')
  assert.equal(guard.lastSeen, null)
  assert.equal(body.shotsFired, 0)
})

test('seeing a target again interrupts the search, refreshes the location and does not repeat the first shout', () => {
  let visible = true, shouts = 0
  const { target, guard } = setup({ sees: () => visible })
  guard.onFirstSpot = () => shouts++
  guard.update(.1)
  visible = false
  guard.update(.1)
  assert.equal(guard.doing, 'search')
  target.x = 10
  visible = true
  guard.update(.1)
  assert.equal(guard.doing, 'pursue')
  assert.equal(guard.lastSeen.x, 10)
  assert.equal(shouts, 1)
})
