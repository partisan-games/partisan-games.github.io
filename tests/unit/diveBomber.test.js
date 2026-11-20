import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let DiveBomber, diveBomber, GameSession, Gunner, turn

before(async() => {
  createPageElements()
  ;({ default: DiveBomber, diveBomber } = await import('/core/actor/aircraft/DiveBomber.js'))
  ;({ default: Gunner } = await import('/core/gameplay/controllers/Gunner.js'))
  ;({ turn } = await import('/core/actor/worldView.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
})

const groundY = 1000
const cruiseY = groundY - 450

/** A Ju 87 alone, with its bomb bursts and its crash written down; nothing of a game around it. */
function bomberAlone(t, { x = 2000, fromBehind = false } = {}) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const impacts = []
  const crashes = []
  // the bomber starts in view, which stands
  const camera = { cameraX: x - 500, cameraY: 0 }
  const bomber = new DiveBomber({ camera, groundY, session, onImpact: point => impacts.push(point),
    onCrash: point => crashes.push(point) })
  bomber.enter({ x, y: cruiseY, fromBehind })
  /** The bomber, its bomb and the bursts live `seconds` or until `until()` holds, as the scene updates them. */
  const live = (seconds, until = () => false, each = () => {}) => {
    for (let i = 0; i < seconds * 30 && !until(); i++) {
      session.update(1 / 30)
      each()
      for (const object of [bomber, ...bomber.children]) object.update(1 / 30)
    }
  }
  return { bomber, session, camera, impacts, crashes, live }
}

test('a Ju 87 can aim only at a point ahead and below it, at least as steep as its shallowest dive', t => {
  const { bomber } = bomberAlone(t)
  assert.equal(bomber.reach, diveBomber.range)
  const below = (ahead, angle) => ({ x: bomber.x + bomber.forward * ahead, y: bomber.y + ahead * Math.tan(angle) })
  assert.equal(bomber.aimAt(below(300, diveBomber.shallowest * 1.1)), true, 'ahead, steep enough')
  assert.equal(bomber.aimAt(below(300, diveBomber.shallowest * .9)), false, 'too shallow')
  assert.equal(bomber.aimAt(below(-300, 1)), false, 'behind it')
  assert.equal(bomber.aimAt({ x: bomber.x - 300, y: bomber.y - 300 }), false, 'above it')
})

test('set to fire, a Ju 87 dives on the aimed point, lets one bomb go above it that bursts there, pulls up and climbs back', t => {
  for (const fromBehind of [false, true]) {
    const { bomber, camera, impacts, live } = bomberAlone(t, { x: fromBehind ? 0 : 2000, fromBehind })
    const aim = { x: bomber.x + bomber.forward * 400, y: groundY }
    assert.equal(bomber.aimAt(aim), true)
    bomber.setState('fire')
    let lowest = bomber.y
    /** The view follows the bomber, as long as the test watches it. */
    const watch = () => {
      lowest = Math.max(lowest, bomber.y)
      camera.cameraX = bomber.x - 500
    }
    live(3, () => bomber.bomb.visible, watch)
    assert.equal(bomber.bomb.visible, true, 'the bomb is let go')
    assert.ok(Math.abs(bomber.y - (aim.y - diveBomber.releaseHeight)) < 30, `at its release height: ${bomber.y}`)
    assert.ok(bomber.dy > 0 && bomber.forward * bomber.dx > 0, 'diving ahead')
    const nose = bomber.angle + bomber.heading
    assert.ok(Math.abs(turn(nose, Math.atan2(bomber.dy, bomber.dx))) < 1e-9, 'the nose points along the path')
    live(3, () => impacts.length > 0, watch)
    assert.equal(impacts.length, 1)
    assert.ok(Math.abs(impacts[0].x - aim.x) < 80, `the bomb bursts where aimed: ${impacts[0].x} for ${aim.x}`)
    assert.equal(impacts[0].y, groundY)
    assert.equal(bomber.bombBurst.visible, true)
    live(6, () => false, watch)
    assert.ok(lowest < groundY - 100, `it pulls up well above the ground: ${lowest}`)
    assert.ok(Math.abs(bomber.y - cruiseY) < 5 && Math.abs(bomber.dy) < 5, `back level at its height: ${bomber.y}`)
    assert.equal(impacts.length, 1, 'one bomb a pass')
  }
})

test('only a Ju 87 set to fire drops its bomb; flying level or shot down it does not, nor once the game is over', t => {
  const idle = bomberAlone(t)
  idle.bomber.aimAt({ x: idle.bomber.x - 400, y: groundY })
  idle.live(5)
  assert.equal(idle.bomber.bomb.visible, false, 'idle')
  assert.equal(idle.bomber.y, cruiseY, 'it flies level')

  const dead = bomberAlone(t)
  dead.bomber.aimAt({ x: dead.bomber.x - 400, y: groundY })
  dead.bomber.setState('fire')
  dead.bomber.takeHit(diveBomber.health)
  assert.equal(dead.bomber.state, 'dead')
  dead.live(5)
  assert.deepEqual(dead.impacts, [], 'shot down')

  const over = bomberAlone(t)
  over.bomber.aimAt({ x: over.bomber.x - 400, y: groundY })
  over.bomber.setState('fire')
  over.session.finish()
  over.live(5)
  assert.deepEqual(over.impacts, [], 'after the result')
})

test('a gunner dives the Ju 87 on a ground target ahead within its reach, and on nothing else', t => {
  const { bomber, impacts, live } = bomberAlone(t)
  const target = { x: bomber.x - 1000, y: groundY, alive: true }
  const gunner = new Gunner(bomber, target)
  live(1, () => false, () => gunner.update())
  assert.equal(bomber.state, 'idle', 'out of reach')
  live(5, () => impacts.length > 0, () => gunner.update())
  assert.ok(Math.abs(impacts[0]?.x - target.x) < 80, `it bombs the target: ${impacts[0]?.x} for ${target.x}`)
  live(1, () => false, () => gunner.update())
  assert.equal(bomber.state, 'idle', 'the target is behind it')

  const calm = bomberAlone(t)
  const dead = { x: calm.bomber.x - 400, y: groundY, alive: false }
  const holding = new Gunner(calm.bomber, dead)
  calm.live(3, () => false, () => holding.update())
  assert.deepEqual(calm.impacts, [], 'a dead target')
})

test('a shot down Ju 87 dives ever steeper nose first, blows up on the ground and reports where it hit', t => {
  const { bomber, crashes, live } = bomberAlone(t)
  live(1 / 30)
  while (bomber.alive) bomber.takeHit(15)
  const dives = []
  for (let second = 0; second < 2; second++) {
    live(.5)
    const nose = bomber.angle + bomber.heading
    dives.push(Math.sin(nose))
    assert.ok(Math.abs(turn(nose, Math.atan2(bomber.dy, bomber.dx))) < 1e-9, 'the nose points along the path')
  }
  assert.ok(dives[0] > .3 && dives[1] > dives[0], `it dives ever steeper: ${dives}`)
  live(5, () => !bomber.visible)
  assert.equal(bomber.visible, false)
  assert.equal(bomber.burst.visible, true)
  assert.deepEqual(crashes, [{ x: bomber.x, y: groundY }])
})

test('a Ju 87 has gone far past the left of the view, or from behind far past its right; head on it may come from far right', t => {
  const away = (fromBehind, cameraOffset) => {
    const { bomber, camera, live } = bomberAlone(t, { x: 500, fromBehind })
    camera.cameraX = bomber.x + cameraOffset
    live(1 / 30)
    return !bomber.visible
  }
  assert.equal(away(false, 2000), true, 'head on, it has passed')
  assert.equal(away(true, 2000), true, 'from behind, it has dropped behind')
  assert.equal(away(true, -4000), true, 'from behind, it has passed')
  assert.equal(away(false, -4000), false, 'head on, it is still coming')
})
