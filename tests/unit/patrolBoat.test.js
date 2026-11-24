import { test } from 'node:test'
import assert from 'node:assert/strict'
import PatrolBoat, { patrolBoatKinds, patrolBoat } from '/core/gameplay/bodies/boats/PatrolBoat.js'
import GameClock from '/core/runtime/GameClock.js'
import Body from '/core/gameplay/bodies/Body.js'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

test('native 40 px/m hulls retain the level scale instead of inheriting the former 25 px/m source scale', async() => {
  createPageElements()
  const { default: PatrolBoatSprite } = await import('/core/actor/boats/PatrolBoatSprite.js')
  const { topProjection } = await import('/core/actor/projection.js')
  for (const id of Object.keys(patrolBoatKinds)) for (const pixels of [25, 40]) {
    const body = new PatrolBoat({ kind: patrolBoatKinds[id], clock: new GameClock() })
    const view = new PatrolBoatSprite(body, { id, projection: topProjection({ pxPerMeter: pixels }) })
    loadAtlas(view, ...view.art.frame)
    const draws = []
    view.render({ save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage: (...args) => draws.push(args) })
    assert.equal(view.art.pixelsPerMetre, 40)
    assert.equal(draws[0][3], view.art.frame[0] * pixels / 40, id)
    assert.equal(draws[0][4], view.art.frame[1] * pixels / 40, id)
  }
})

test('every vessel offers a practice shot in front of its actual gun', () => {
  for (const kind of Object.values(patrolBoatKinds)) for (const yaw of [0, Math.PI, .8]) {
    const boat = new PatrolBoat({ kind, yaw, clock: new GameClock() })
    const shot = boat.shots.straight
    assert.equal(boat.aimAt({ x: boat.x + boat.forward * shot.x, z: boat.z + shot.z }), true)
    assert.ok(Math.abs(boat.bearing - yaw) < 1e-6 || Math.abs(Math.abs(boat.bearing - yaw) - Math.PI * 2) < 1e-6)
  }
})

for (const [id, kind] of Object.entries(patrolBoatKinds))
  test(`${id} turns its fixed gun onto a target, damages it, then sinks without reviving`, () => {
    const clock = new GameClock()
    // The target stays outside the new long hulls; gun range starts at the barrel.
    const target = new Body({ x: Math.max(15, kind.size.length / 2 + 5), health: 1000, size: { length: 3, height: 3, width: 3 } })
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

