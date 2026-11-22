import { test } from 'node:test'
import assert from 'node:assert/strict'
import PatrolBoat, { patrolBoatKinds, patrolBoat } from '/core/gameplay/bodies/boats/PatrolBoat.js'
import GameClock from '/core/runtime/GameClock.js'
import Body from '/core/gameplay/bodies/Body.js'

for (const [id, kind] of Object.entries(patrolBoatKinds))
  test(`${id} turns its fixed gun onto a target, damages it, then sinks without reviving`, () => {
    const clock = new GameClock()
    const target = new Body({ x: 15, health: 1000, size: { length: 3, height: 3, width: 3 } })
    const boat = new PatrolBoat({ kind, clock, targets: [target] })
    boat.aimAt(target)
    boat.setState('attack')
    const live = seconds => {
      for (let frame = 0; frame < seconds * 60; frame++) {
        clock.advance(1 / 60)
        boat.aimAt(target)
        boat.update(1 / 60)
      }
    }
    live(4)
    assert.ok(boat.shotsFired > 0)
    assert.ok(target.hitsTaken > 0, 'real bullets hit the target')
    assert.ok(boat.bursts > 0)
    boat.takeHit(kind.health)
    boat.setState('move')
    assert.equal(boat.state, 'dead')
    assert.equal(boat.afloat, true)
    const position = [boat.x, boat.z]
    live(patrolBoat.sink + .1)
    assert.equal(boat.sunk, true)
    assert.equal(boat.afloat, false)
    assert.deepEqual([boat.x, boat.z], position)
    assert.ok(kind.health < 300, 'the S-boat remains the strongest enemy')
  })

