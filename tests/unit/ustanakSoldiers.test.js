import { test } from 'node:test'
import assert from 'node:assert/strict'
import Skirmisher, { volley } from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import CannonCrew, { drill } from '/core/gameplay/bodies/soldiers/CannonCrew.js'
import FlagBearer from '/core/gameplay/bodies/soldiers/FlagBearer.js'
import { ground } from '/core/gameplay/bodies/ground.js'
import { earthGravity } from '/core/gameplay/gravity.js'

const live = (body, seconds) => {
  for (let i = 0; i < seconds * 30; i++) body.update(1 / 30)
}

test('a flag bearer marches in his facing direction, rests, and stays where he falls', () => {
  const bearer = new FlagBearer({ x: 20, yaw: Math.PI })
  bearer.setState('move')
  live(bearer, 1)
  assert.ok(bearer.x < 20)
  const { x } = bearer
  bearer.setState('idle')
  live(bearer, .5)
  assert.equal(bearer.x, x)
  bearer.setState('dead')
  bearer.setState('move')
  live(bearer, .8)
  assert.equal(bearer.state, 'dead')
  assert.equal(bearer.x, x)
})

test('a skirmisher stands until set to fire, then fires again and again at his interval', () => {
  const soldier = new Skirmisher({ x: 30 })
  assert.deepEqual(soldier.states, ['idle', 'fire', 'standUp', 'walk', 'kneel', 'dead'])
  live(soldier, volley.interval * 2)
  assert.equal(soldier.shotsFired, 0, 'he stands')
  soldier.setState('fire')
  live(soldier, volley.interval * 2 + .1)
  assert.equal(soldier.shotsFired, 2)
  assert.equal(soldier.state, 'fire', 'he keeps firing')
})

test('a gun crew stands by, loads while set to, and after a shot and its recoil stands by again', () => {
  const crew = new CannonCrew({ x: 11 })
  assert.deepEqual(crew.states, ['idle', 'load', 'fire', 'dead'])
  crew.setState('load')
  live(crew, 2)
  assert.equal(crew.state, 'load', 'it keeps loading')
  crew.setState('fire')
  live(crew, drill.fire - .1)
  assert.equal(crew.state, 'fire')
  live(crew, .2)
  assert.equal(crew.state, 'idle')
})

test('they stand on the ground under their feet, fall with gravity into a crater, never below it, and stand up on new ground', () => {
  let depth = 0
  const groundAt = () => -depth
  const bodies = [new Skirmisher({ x: 30, groundAt }), new CannonCrew({ x: 11, groundAt }), new FlagBearer({ x: 4, groundAt })]
  const feet = body => body.y - body.size.height / 2
  for (const body of bodies) assert.equal(feet(body), 0)
  depth = 2.4
  for (const body of bodies) {
    body.update(0)
    assert.equal(feet(body), 0, 'no time, no fall: a paused game stands still')
    body.update(1 / 30)
    assert.ok(Math.abs(feet(body) + earthGravity * ground.fall / 900) < 1e-9, 'it starts falling')
    live(body, 1)
    assert.equal(feet(body), -2.4)
  }
  depth = 0
  for (const body of bodies) {
    body.update(1 / 30)
    assert.equal(feet(body), 0)
  }
})
