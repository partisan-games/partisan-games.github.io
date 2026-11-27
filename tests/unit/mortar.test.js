import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameClock from '/core/runtime/GameClock.js'
import CannonAI from '/core/gameplay/controllers/CannonAI.js'
import FieldGun from '/core/gameplay/bodies/artillery/FieldGun.js'
import Mortar, { mortar } from '/core/gameplay/bodies/artillery/Mortar.js'

/** Lets `piece` fire its charged shot and lives until it lands; gives where and after how many seconds. */
function landing(piece) {
  assert.equal(piece.launch(), true)
  const shell = piece.shells.projectiles.find(projectile => projectile.active)
  let seconds = 0
  while (shell.state === 'flight' && seconds < 60) {
    piece.update(1 / 60)
    seconds += 1 / 60
  }
  const { x } = shell
  while (piece.hasActiveShot) piece.update(1 / 60)
  return { x, seconds }
}

test('the mortar aims only steeply, and a higher tube throws nearer', () => {
  const piece = new Mortar({ x: 0 })
  piece.elevation = 0
  assert.equal(piece.elevation, Math.PI / 4)
  piece.elevation = Math.PI / 2
  assert.equal(piece.elevation, mortar.highest)
  const distances = [.9, 1.2].map(elevation => {
    piece.elevation = elevation
    piece.force = 20
    return landing(piece).x
  })
  assert.ok(distances[0] > distances[1] + 5, distances.join(' > '))
})

for (const way of [1, -1])
  test(`aimed at a point ${way > 0 ? 'right' : 'left'}, a mortar bomb lands there after a longer flight than a ball`, () => {
    const target = { x: 40 * way, y: 0 }
    const flights = [new Mortar({ x: 0, yaw: way > 0 ? 0 : Math.PI }), new FieldGun({ x: 0, yaw: way > 0 ? 0 : Math.PI })]
      .map(piece => {
        assert.equal(piece.aimAt(target), true)
        piece.force = piece.aimedForce
        return landing(piece)
      })
    assert.ok(Math.abs(flights[0].x - target.x) < .5, `${flights[0].x}`)
    assert.ok(flights[0].seconds > flights[1].seconds * 1.5, `${flights[0].seconds} s against ${flights[1].seconds} s`)
  })

test('at full force, a mortar short of its target lowers its tube to throw farther', () => {
  const target = new Mortar({ x: 0 })
  const piece = new Mortar({ x: 60, yaw: Math.PI })
  const ai = new CannonAI({ cannon: piece, target, clock: new GameClock() })
  ai.elevation = piece.elevation = 1.2
  ai.adjustment = 1
  ai.lastShot = { projectile: { x: 20 }, force: mortar.maxForce, health: 100 }
  ai.observeShot()
  assert.ok(piece.elevation < 1.2)
})

for (const [distance, random] of [[25, .5], [45, .1]])
  test(`the computer walks its mortar bombs onto a target ${distance} m away`, () => {
    const clock = new GameClock()
    const target = new Mortar({ x: 10 })
    const piece = new Mortar({ x: target.x + distance, yaw: Math.PI, targets: [target] })
    const ai = new CannonAI({ cannon: piece, target, clock, random: () => random })
    for (let shot = 0; shot < 8 && target.health.current === 100; shot++) {
      clock.advance(1.2)
      ai.update()
      assert.ok(piece.hasActiveShot)
      while (piece.hasActiveShot) piece.update(1 / 60)
      ai.beginTurn()
    }
    assert.ok(target.health.current < 100)
  })

for (const way of [1, -1])
  for (const elevation of [mortar.lowest, mortar.highest])
    test(`a shot hits the drawn tube and plate but not the empty space by them, facing ${way}, elevation ${elevation.toFixed(2)}`, () => {
      const piece = new Mortar({ x: 10, yaw: way > 0 ? 0 : Math.PI })
      piece.elevation = elevation
      const touches = point => piece.hitTime(point, point, .1) !== null
      const along = { x: Math.cos(piece.barrelAngle), y: Math.sin(piece.barrelAngle) }
      const { muzzle } = piece
      assert.equal(touches({ x: muzzle.x - .1 * along.x, y: muzzle.y - .1 * along.y }), true, 'the mouth')
      assert.equal(touches({ x: muzzle.x + .3 * along.x, y: muzzle.y + .3 * along.y }), false, 'past the mouth')
      assert.equal(touches({ x: piece.x - .35 * way, y: piece.ground + .05 }), true, 'the back of the plate')
      assert.equal(touches({ x: piece.x - .35 * way, y: piece.ground + .5 }), false, 'above the plate')
    })
