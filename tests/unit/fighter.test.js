import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Fighter, fighter, GameSession, GameObject2D, turn

before(async() => {
  createPageElements()
  ;({ default: Fighter, fighter } = await import('/core/actor/aircraft/Fighter.js'))
  ;({ turn } = await import('/core/actor/worldView.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

const planeHealth = 100

/** A fighter alone with a plane that only counts the damage it takes; nothing of a game around them. */
function fighterAlone(t, { groundY = 5000, onCrash, camera = { cameraX: 0, cameraY: 0 } } = {}) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const plane = new GameObject2D(null, { x: 300, y: 200, width: 80, height: 40 })
  plane.health = planeHealth
  plane.takeHit = damage => {
    plane.health -= damage
  }
  const enemy = new Fighter({ plane, camera, groundY, session, onCrash })
  return { enemy, plane, session }
}

test('a fighter aims only at a point within its cone ahead of its nose, and reaches as far as its range', t => {
  const { enemy, plane } = fighterAlone(t)
  enemy.enter({ x: plane.x + 400, y: plane.y, fromBehind: false })
  assert.equal(enemy.reach, fighter.range)
  assert.equal(enemy.aimAt(plane), true)
  assert.equal(enemy.aimAt({ x: enemy.x - 300, y: enemy.y + 300 * Math.tan(fighter.cone * .9) }), true, 'inside the cone')
  assert.equal(enemy.aimAt({ x: enemy.x - 300, y: enemy.y + 300 * Math.tan(fighter.cone * 1.5) }), false, 'outside the cone')
  enemy.setPosition(plane.x - 400, plane.y)
  assert.equal(enemy.aimAt(plane), false, 'the plane is behind it')
})

test('a fighter fires straight ahead along its heading as its guns reload, only in state fire, and only while the game runs', t => {
  const { enemy, plane, session } = fighterAlone(t)
  enemy.enter({ x: plane.x + 400, y: plane.y, fromBehind: false })

  enemy.update(1 / 30)
  assert.equal(enemy.bullets.projectiles.length, 0, 'idle, it does not fire')
  enemy.setState('fire')
  enemy.setPosition(plane.x + 5000, plane.y - 900)
  enemy.update(1 / 30)
  assert.equal(enemy.bullets.projectiles.length, 1, 'set to fire, it does, wherever the plane is')
  const [round] = enemy.bullets.projectiles
  assert.ok(round.dx < 0 && Math.abs(round.dy - enemy.dy) < 1e-9, 'straight ahead along its heading')
  session.finish()
  enemy.update(1)
  assert.equal(enemy.bullets.projectiles.length, 1, 'no shot after the result')
})

test('a shot down fighter fires no more', t => {
  const { enemy } = fighterAlone(t)
  enemy.enter({ x: 1000, y: 100, fromBehind: false })
  enemy.setState('fire')
  while (enemy.alive) enemy.takeHit(15)
  assert.equal(enemy.state, 'dead')
  for (let i = 0; i < 30; i++) enemy.update(1 / 30)
  assert.equal(enemy.bullets.projectiles.length, 0)
})

test('a fighter bullet takes only a little of the plane health', t => {
  const { enemy, plane } = fighterAlone(t)
  enemy.enter({ x: plane.x + 400, y: plane.y, fromBehind: false })
  enemy.weapon.tryFire(enemy.position, Math.PI)
  enemy.bullets.projectiles[0].hit(plane)
  assert.equal(plane.health, planeHealth - fighter.damage)
})

test('a shot down fighter falls, blows up on the ground and reports where it hit', t => {
  const crashes = []
  const { enemy } = fighterAlone(t, { groundY: 500, onCrash: point => crashes.push(point) })
  enemy.enter({ x: 1000, y: 100, fromBehind: false })
  while (enemy.alive) enemy.takeHit(15)
  assert.deepEqual(crashes, [], 'it has not hit the ground yet')
  for (let i = 0; i < 30 * 5 && enemy.visible; i++) enemy.update(1 / 30)
  assert.equal(enemy.visible, false)
  assert.equal(enemy.burst.visible, true)
  assert.deepEqual(crashes, [{ x: enemy.x, y: 500 }])
})

test('a shot down fighter dives ever steeper nose first, with its windmilling propeller at the nose', t => {
  for (const fromBehind of [false, true]) {
    const { enemy } = fighterAlone(t)
    enemy.enter({ x: 1000, y: 100, fromBehind })
    enemy.update(1 / 30) // it is shot down in flight
    while (enemy.alive) enemy.takeHit(15)
    const dives = []
    const turns = []
    for (let second = 0; second < 3; second++) {
      for (let i = 0; i < 30; i++) enemy.update(1 / 30)
      turns.push(enemy.propellerSpin)
      const nose = enemy.angle + enemy.heading
      dives.push(Math.sin(nose))
      assert.ok(Math.abs(turn(nose, Math.atan2(enemy.dy, enemy.dx))) < 1e-9, 'the nose points along the path')
    }
    assert.ok(dives[0] > .3 && dives[1] > dives[0] && dives[2] > dives[1], `it dives ever steeper: ${dives}`)
    assert.ok(Math.sign(enemy.propeller.x - enemy.x) === (fromBehind ? 1 : -1), 'the propeller stays at the nose')
    assert.ok(enemy.propeller.y > enemy.y, 'which points down')
    assert.ok(Math.abs(turn(enemy.propeller.angle, enemy.angle)) < 1e-9, 'and turns with the plane')
    assert.ok(turns[0] < 5 && turns[2] > 0 && turns[2] < turns[0], `the blades slow down but keep turning: ${turns}`)
  }
})

test('a fighter passes above or below the plane and never rams it, head on or from behind', t => {
  // either side is picked at random, so each way is flown several times
  const passes = [false, true].flatMap(fromBehind => Array(5).fill(fromBehind))
  for (const fromBehind of passes) {
    const { enemy, plane, session } = fighterAlone(t, { groundY: 800 })
    plane.setPosition(300, 400)
    plane.width = 220 // the images do not load in tests
    plane.height = 95
    enemy.width = 210
    enemy.height = 69
    enemy.enter({ x: fromBehind ? -200 : 1500, y: plane.y, fromBehind })
    let alongside = false
    for (let i = 0; i < 30 * 6; i++) {
      session.update(1 / 30)
      enemy.update(1 / 30)
      assert.equal(enemy.collidesWith(plane), false, `${fromBehind ? 'from behind' : 'head on'} at ${enemy.x}, ${enemy.y}`)
      alongside ||= Math.abs(enemy.x - plane.x) < plane.width
    }
    assert.equal(alongside, true, 'it came by the plane')
    assert.ok(fromBehind ? enemy.x > plane.x : enemy.x < plane.x, 'it has passed')
  }
})

test('a fighter propeller spins at the nose, on whichever side the nose is', t => {
  const { enemy: headOn } = fighterAlone(t)
  const { enemy: chaser } = fighterAlone(t)
  headOn.enter({ x: 1000, y: 100, fromBehind: false })
  chaser.enter({ x: 1000, y: 100, fromBehind: true })
  const squeezes = []
  for (let i = 0; i < 6; i++) {
    headOn.update(1 / 30)
    chaser.update(1 / 30)
    squeezes.push(headOn.propeller.scaleY)
  }
  assert.ok(new Set(squeezes.map(value => value.toFixed(2))).size > 2, 'it turns')
  assert.ok(headOn.propeller.x < headOn.x, 'head on the nose is on the left')
  assert.ok(chaser.propeller.x > chaser.x, 'from behind it is on the right')
  assert.equal(chaser.propeller.flipY, -1)
})

test('the propeller stays visible in a distant world viewport', t => {
  const view = { cameraX: 5000, cameraY: 1000 }
  const { enemy } = fighterAlone(t, { camera: view, groundY: 1500 })
  enemy.enter({ x: 5300, y: 1200, fromBehind: false })
  enemy.propeller.width = 20
  enemy.propeller.height = 70
  enemy.propeller.setPosition(5200, 1200)
  assert.equal(enemy.propeller.shown, true)
  view.cameraX = 8000
  assert.equal(enemy.propeller.shown, false)
})
