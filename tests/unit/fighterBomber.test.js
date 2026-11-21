import { test } from 'node:test'
import assert from 'node:assert/strict'
import FighterBomber, { fighterBomber } from '/core/gameplay/bodies/aircraft/FighterBomber.js'
import AttackPlane from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import GameClock from '/core/runtime/GameClock.js'

/** The plane in the middle of a 100 by 70 m view, on its own clock. */
function planeAlone(options = {}) {
  const clock = new GameClock()
  const body = new FighterBomber({ x: 50, z: 50, clock, bounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 70 }, ...options })
  const live = (seconds, fps = 60) => {
    for (let i = 0; i < seconds * fps; i++) {
      clock.advance(1 / fps)
      body.update(1 / fps)
    }
  }
  return { body, clock, live }
}

test('a key pushes it across the view as far at 30 as at 60 frames a second, and the edges stop it', () => {
  const at = fps => {
    const { body, live } = planeAlone()
    for (let i = 0; i < fps / 2; i++) {
      body.steer(1, 0, 1 / fps)
      live(1 / fps, fps)
    }
    return body.x
  }
  assert.ok(Math.abs(at(30) - at(60)) < 1)
  const { body, live } = planeAlone()
  for (let i = 0; i < 120; i++) {
    body.steer(-1, -1, 1 / 60)
    live(1 / 60)
  }
  assert.equal(body.x, body.size.length / 4)
  assert.equal(body.z, body.size.width / 2)
})

test('it fires straight up the view as often as it reloads, with more guns at each fire level', () => {
  const { body, clock } = planeAlone()
  assert.equal(body.shoot(), true)
  assert.equal(body.shoot(), false, 'not before the reload')
  const [round] = body.bullets.projectiles
  assert.ok(round.vz < 0 && Math.abs(round.vx) < 1e-9, 'up the view')
  for (const [level, guns] of [[1, 2], [2, 3]]) {
    body.fireLevel = level
    clock.advance(fighterBomber.reload)
    const before = body.bullets.projectiles.filter(bullet => bullet.active).length
    body.shoot()
    assert.equal(body.bullets.projectiles.filter(bullet => bullet.active).length - before, guns)
  }
  assert.equal(body.aimAt({ x: 50, z: 10 }), true)
  assert.equal(body.aimAt({ x: 50, z: 60 }), false, 'not behind it')
})

test('any hit shoots it down, but not while it is shielded or looping', () => {
  const { body, live } = planeAlone()
  body.shield = 1
  assert.equal(body.takeHit(1), false)
  live(1.1)
  body.loop()
  assert.equal(body.takeHit(1), false, 'in a loop')
  live(fighterBomber.loop.duration + .1)
  assert.equal(body.looping, false)
  assert.equal(body.takeHit(1), true)
  assert.equal(body.state, 'dead')
})

test('a loop ends a little ahead of where it began, and it has three a life', () => {
  const { body, live } = planeAlone()
  const { z } = body
  body.loop()
  live(fighterBomber.loop.duration / 2)
  assert.ok(body.z < z - fighterBomber.loop.ahead * .9, 'it climbs ahead')
  live(fighterBomber.loop.duration)
  assert.ok(Math.abs(body.z - z) < 1e-9)
  body.loop()
  live(2)
  body.loop()
  live(2)
  assert.equal(body.loop(), false, 'no fourth loop')
  body.revive()
  assert.equal(body.loopsLeft, fighterBomber.loops)
})

test('flying into an enemy plane takes a hit off it and shoots both down; while shielded it does not', () => {
  const clock = new GameClock()
  const enemy = new AttackPlane({ x: 50, z: 50, clock })
  const { body, live } = planeAlone({ solids: [enemy] })
  body.shield = 1
  live(1 / 60)
  assert.equal(enemy.alive, true)
  live(1)
  assert.equal(enemy.alive, false)
  assert.equal(body.alive, false)
})

test('it drops only the bombs it has', () => {
  const { body } = planeAlone()
  for (let i = 0; i < fighterBomber.bombs; i++) assert.equal(body.dropBomb(), true)
  assert.equal(body.dropBomb(), false)
  assert.equal(body.bombsDropped, fighterBomber.bombs)
})

test('rearmed on an airfield, it has a full load of bombs, and keeps more it had from power-ups', () => {
  const { body } = planeAlone()
  body.bombs = 0
  body.rearm()
  assert.equal(body.bombs, fighterBomber.bombs)
  body.bombs = fighterBomber.bombs + 1
  body.rearm()
  assert.equal(body.bombs, fighterBomber.bombs + 1)
})
