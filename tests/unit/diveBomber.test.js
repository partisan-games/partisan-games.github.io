import { test } from 'node:test'
import assert from 'node:assert/strict'
import DiveBomber, { diveBomber } from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'

/** A Ju 87 flying left 17.86 m up from x 100, with no page; it records where its bomb and wreck hit. */
function bomberAlone({ canFire = () => true } = {}) {
  const impacts = [], crashes = []
  const body = new DiveBomber({ x: 100, y: 17.86, yaw: Math.PI, canFire, onImpact: point => impacts.push(point),
    onCrash: point => crashes.push(point) })
  body.enter()
  const live = (seconds, controller) => {
    for (let i = 0; i < seconds * 30; i++) {
      controller?.update()
      body.update(1 / 30)
    }
  }
  return { body, impacts, crashes, live }
}

test('a Ju 87 can aim only at a point ahead and below it, at least as steep as its shallowest dive', () => {
  const { body } = bomberAlone()
  assert.equal(body.aimAt({ x: 92.86, y: 7.14 }), true)
  assert.equal(body.aimAt({ x: 107.14, y: 7.14 }), false, 'behind it')
  assert.equal(body.aimAt({ x: 71.43, y: 7.14 }), false, 'too shallow')
})

test('set to fire, a Ju 87 dives on the aimed point, lets one bomb go that bursts there, pulls up and climbs back', () => {
  const { body, impacts, live } = bomberAlone()
  body.aimAt({ x: 85.71, y: 0 })
  body.setState('attack')
  let lowest = body.y
  for (let i = 0; i < 30 * 8; i++) {
    live(1 / 30)
    lowest = Math.min(lowest, body.y)
  }
  assert.equal(body.shotsFired, 1, 'one bomb a pass')
  assert.equal(impacts.length, 1)
  assert.ok(Math.abs(impacts[0].x - 85.71) < 2.86, 'the bomb bursts near the aimed point')
  assert.ok(lowest < 17.86 - diveBomber.releaseHeight / 2, 'it dived')
  assert.ok(Math.abs(body.y - 17.86) < .71 && Math.abs(body.pitch) < .05, 'back level at its height')
})

test('flying level, shot down or after the result a Ju 87 drops no bomb', () => {
  let running = false
  const { body, impacts, live } = bomberAlone({ canFire: () => running })
  body.aimAt({ x: 85.71, y: 0 })
  live(3)
  body.setState('attack')
  live(5)
  assert.equal(impacts.length, 0, 'not after the result')
  running = true
  const second = bomberAlone()
  second.body.aimAt({ x: 85.71, y: 0 })
  second.body.setState('dead')
  second.live(5)
  assert.equal(second.impacts.length, 0, 'not shot down')
})

test('a gunner dives the Ju 87 on a ground target ahead within its reach, and on nothing else', () => {
  const { body, live } = bomberAlone()
  const target = { x: 300, y: 0, alive: true }
  const gunner = new Gunner(body, target)
  live(1, gunner)
  assert.equal(body.state, 'idle', 'behind and far')
  target.x = body.x - 10.71
  live(1 / 30, gunner)
  assert.equal(body.state, 'attack')
})

test('a shot down Ju 87 dives ever steeper and crashes where it reaches the ground', () => {
  const { body, crashes, live } = bomberAlone()
  body.setState('dead')
  live(1 / 30)
  const { pitch } = body
  live(.5)
  assert.ok(body.pitch < pitch)
  live(5)
  assert.equal(body.crashed, true)
  assert.deepEqual(crashes, [{ x: body.x, y: 0 }])
})

test('the offered dive targets the ground after cruising in either direction', () => {
  for (const way of [-1, 1]) {
    const { body, impacts, live } = bomberAlone()
    body.face(way)
    live(4)
    const target = body.shots.down
    assert.ok(body.aimAt({ x: body.x + way * target.x, y: body.y + target.y }))
    body.setState('attack')
    live(.25)
    assert.ok(body.y < body.cruiseY && body.loaded, 'the dive starts before bomb release')
    live(8)
    assert.deepEqual([impacts.length, body.shotsFired, body.state], [1, 1, 'move'])
    assert.ok(Math.abs(body.y - body.cruiseY) < .1)
  }
})

test('a Ju 87 bends into its dive and out of it in wide arcs and pulls out well above the point it bombs', () => {
  for (const depth of [12.86, 27]) {
    const { body, live } = bomberAlone()
    const aim = { x: body.x - 9.71, y: body.y - depth }
    body.aimAt(aim)
    body.setState('attack')
    let lowest = body.y, tightest = Infinity
    for (let i = 0; i < 30 * 8; i++) {
      const { pitch } = body
      live(1 / 30)
      lowest = Math.min(lowest, body.y)
      const turn = Math.abs(body.pitch - pitch) * 30
      if (turn > .01) tightest = Math.min(tightest, Math.hypot(body.vx, body.vy) / turn)
    }
    assert.ok(tightest >= 9, `no turn tighter than 9 m across, ${tightest.toFixed(1)} m from ${depth} m up`)
    assert.ok(lowest >= aim.y + diveBomber.releaseHeight * .75 - .1, `it stays above the point, ${(lowest - aim.y).toFixed(1)} m from ${depth} m up`)
  }
})
