import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Turns from '/scenes/ustanak/Turns.js'
import { fieldGun } from '/core/gameplay/bodies/artillery/FieldGun.js'
import { crater } from '/scenes/ustanak/Terrain.js'
import { loadAtlas } from './helpers/atlas.js'

let keyboard, Scene

before(async() => {
  createPageElements()
  ;({ keyboard } = await import('/core/io/Keyboard.js'))
  Scene = (await import('/scenes/ustanak/Main.js')).default
})

/** A running Ustanak scene, which the test plays step by step. */
function createScene(t) {
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => {
    keyboard.reset()
    scene.end()
  })
  scene.session.start()
  return scene
}

test('only the active artillery side may fire and the turn changes once after settlement', () => {
  const turns = new Turns()
  assert.equal(turns.fire(1), false)
  assert.equal(turns.fire(0), true)
  assert.equal(turns.fire(0), false)
  assert.equal(turns.settle(true), false)
  assert.equal(turns.active, 0)
  assert.equal(turns.settle(false), true)
  assert.equal(turns.active, 1)
  assert.equal(turns.waitForRelease, true)
  assert.equal(turns.settle(false), false)
})

test('the house starts intact without smoke and shells pass through it without a collision', async t => {
  const scene = createScene(t)
  loadAtlas(scene.bunker, 428, 286)
  await import('/core/actor/Flame.js')
  await null
  assert.equal(scene.bunker.alive, true)
  assert.equal(scene.bunker.burning, false)
  assert.equal(scene.bunker.flame.sparks.length, 0)
  for (const gun of scene.guns) assert.equal(gun.targets.includes(scene.bunker), false)
  const point = scene.projection.toWorld({ x: scene.bunker.x - scene.bunker.width / 2 - 10, y: scene.bunker.y })
  const ball = scene.guns[0].shells.fire({ ...point, z: 0 }, 0, 0, 20)
  ball.update(.025)
  assert.equal(ball.firstHit(scene.guns[0].targets), null, 'entering the house does not end flight')
  assert.equal(ball.state, 'flight')
  assert.equal(scene.bunker.alive, true)
})

for (const side of [0, 1]) for (const terrainEnabled of [false, true])
  test(`a nearby shell burst ruins the house once and starts smoke, side ${side}, terrain ${terrainEnabled}`, async t => {
    const scene = createScene(t)
    scene.terrain.enabled = terrainEnabled
    loadAtlas(scene.bunker, 428, 286)
    await import('/core/actor/Flame.js')
    await null
    const die = t.mock.method(scene.bunker, 'die')
    const land = screenX => {
      const { x } = scene.projection.toWorld({ x: screenX, y: 0 })
      const ball = scene.guns[side].shells.fire({ x, y: scene.groundAt(x) + .2, z: 0 }, 0, -Math.PI / 2, 2.5)
      ball.update(.1)
      const impact = ball.firstHit([])
      assert.equal(impact.ground, true)
      ball.strike(impact)
    }
    land(scene.bunker.x + scene.bunker.width / 2 + crater.halfWidth + 20)
    assert.equal(scene.bunker.alive, true, 'a distant burst leaves the house intact')
    const near = scene.bunker.x - scene.bunker.width / 2 - crater.halfWidth + 1
    land(near)
    assert.equal(scene.bunker.dead, true)
    assert.equal(scene.bunker.burning, true)
    assert.equal(scene.bunker.smoky, true)
    scene.bunker.update(.1)
    assert.ok(scene.bunker.flame.sparks.length > 0, 'smoke starts only after destruction')
    land(near)
    assert.equal(die.mock.callCount(), 1)
    scene.finishRound(0)
    scene.nextRound()
    assert.equal(scene.children.includes(scene.bunker), false)
    assert.equal(scene.bunker.flame.sparks.length, 0, 'removed first-round scenery leaves no smoke')
  })

test('the scene routes shared keys only to the active human gun', t => {
  const scene = createScene(t)
  scene.vsComputer = false
  scene.turns.waitForRelease = false
  const [own, enemy] = scene.guns
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(own.force, fieldGun.minForce + fieldGun.chargeRate * .5)
  assert.equal(enemy.force, fieldGun.minForce)
  keyboard.pressed.Space = false
  scene.handleInput(.01)
  scene.update(0, 0)
  assert.equal(scene.turns.phase, 'flight')
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(enemy.force, fieldGun.minForce)
  own.shells.projectiles.forEach(shell => shell.setState('idle'))
  scene.update(.01, .01)
  assert.equal(scene.turns.active, 1)
  assert.equal(scene.ui.message, 'Player 2\'s turn')
  scene.session.update(1.2)
  scene.handleInput(.5)
  assert.equal(enemy.force, fieldGun.minForce, 'held fire does not transfer to the next player')
  keyboard.pressed.Space = false
  scene.handleInput(.01)
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(enemy.force, fieldGun.minForce + fieldGun.chargeRate * .5)
  assert.equal(own.force, fieldGun.minForce)
})

test('a player can charge and fire while the opening instructions remain visible', t => {
  const scene = createScene(t)
  scene.announceTurn()
  scene.handleInput(0)
  keyboard.pressed.Space = true
  scene.handleInput(.2)
  assert.ok(scene.guns[0].charged)
  assert.equal(scene.crews[0].state, 'load', 'the crew loads while fire is held')
  keyboard.pressed.Space = false
  scene.handleInput(0)
  scene.update(0, 0)
  assert.equal(scene.turns.phase, 'flight')
  assert.equal(scene.guns[0].hasActiveShot, true)
  assert.equal(scene.crews[0].state, 'attack', 'and fires the shot')
  assert.equal(scene.announcingTurn, true)
  assert.match(scene.ui.messageElement.textContent, /Hold Space/)
})

test('turn announcements inform without blocking play and wait through a pause', t => {
  const scene = createScene(t)
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.querySelector('h3').textContent, 'Your turn')
  assert.match(scene.ui.messageElement.textContent, /Hold Space/)
  assert.equal(scene.canShoot(0), true)
  scene.session.pause()
  scene.session.update(100)
  assert.equal(scene.ui.messageElement.querySelector('h3').textContent, 'Your turn')
  scene.session.resume()
  scene.session.update(5)
  assert.equal(scene.ui.messageElement.textContent, '')
  assert.equal(scene.canShoot(0), true)
  scene.turns.fire(0)
  scene.turns.settle(false)
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.querySelector('h3').textContent, 'Computer\'s turn')
  assert.equal(scene.crews[1].state, 'load', 'the computer\'s crew loads')
  assert.equal(scene.canShoot(1), true)
  scene.vsComputer = false
  scene.turns.active = 0
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.querySelector('h3').textContent, 'Player 1\'s turn')
})

test('the opening message is only the turn and how to play; each later round names its 1941 location, later turns omit it', t => {
  const scene = createScene(t)
  t.mock.method(scene.gameLoop, 'start', () => {})
  const labels = new Set(['Grahovo, 1941', 'Vilusi, 1941', 'Nikšić area, 1941'])
  const seen = new Set()
  scene.start()
  for (let round = 0; round < 3; round++) {
    const text = scene.ui.messageElement.textContent
    const location = round ? scene.ui.messageElement.querySelector('p').textContent : null
    if (round) {
      assert.ok(labels.has(location))
      seen.add(location)
      assert.equal(location, scene.battlefield.place.place.label, 'the label belongs to the shown scenery')
    } else {
      assert.ok([...labels].every(label => !text.includes(label)), 'the report, not the opening message, tells the history')
      assert.match(text, /Hold Space/)
    }
    assert.match(scene.ui.messageElement.querySelector('h3').textContent, /turn/)
    assert.equal(scene.canShoot(scene.turns.active), true, 'the announcement does not block the turn')
    scene.session.pause()
    scene.session.update(100)
    assert.equal(scene.ui.messageElement.textContent, text, 'the message waits through a pause')
    scene.session.resume()
    scene.session.update(5)
    assert.equal(scene.ui.messageElement.textContent, '')
    scene.announceTurn()
    assert.equal(scene.ui.messageElement.querySelector('p'), null, 'ordinary turns do not repeat the location')
    if (round < 2) {
      scene.finishRound(round)
      scene.nextRound()
    }
  }
  assert.equal(seen.size, 2, 'the two later rounds are fought at two other places')
})

test('round transitions preserve scores, alternate opening sides and cancel old impacts and input', t => {
  const scene = createScene(t)
  scene.vsComputer = false
  const [own, enemy] = scene.guns
  scene.turns.active = 1
  enemy.launch()
  const [shell] = enemy.shells.projectiles
  shell.update(0)
  shell.strike({ target: own, time: 0 })
  own.force = 70
  enemy.setState('dead')
  scene.update(0, 0)
  assert.deepEqual(scene.score, [1, 0])
  assert.equal(scene.session.state, 'running')
  assert.equal(scene.ui.outro, '')
  assert.equal(scene.ui.screen, 'round')
  assert.equal(scene.canShoot(0), false)
  scene.update(1, 1)
  assert.deepEqual(scene.score, [1, 0], 'the round is counted only once')
  keyboard.pressed.Space = true
  scene.nextRound()
  assert.equal(scene.round, 2)
  assert.equal(scene.turns.active, 1)
  assert.equal(scene.turns.waitForRelease, true)
  assert.equal(keyboard.isDown({ codes: ['Space'] }), false)
  assert.equal(scene.ai.nextForce, null)
  assert.equal(scene.children.includes(own), false, 'the guns of the last round are gone')
  assert.equal(scene.guns[0].charged, false)
  scene.update(2, 2)
  assert.equal(scene.guns[0].health.current, 100, 'an old impact cannot damage the new round')
  assert.equal(scene.guns[1].health.current, 100)
  scene.guns[0].setState('dead')
  scene.update(0, 0)
  assert.deepEqual(scene.score, [1, 1])
  scene.nextRound()
  assert.equal(scene.round, 3)
  assert.equal(scene.turns.active, 0)
  scene.guns[1].setState('dead')
  scene.update(0, 0)
  assert.equal(scene.session.state, 'finished')
  assert.match(scene.ui.outro, /Player 1 wins the match/)
  assert.deepEqual(scene.score, [2, 1])
  scene.nextRound()
  scene.update(0, 0)
  assert.equal(scene.round, 3)
  assert.deepEqual(scene.score, [2, 1])
})

test('two computer round wins end the match with a defeat', t => {
  const scene = createScene(t)
  for (let i = 0; i < 2; i++) {
    scene.guns[0].setState('dead')
    scene.update(0, 0)
    if (i === 0) scene.nextRound()
  }
  assert.deepEqual(scene.score, [0, 2])
  assert.match(scene.ui.outro, /Game over/)
  assert.match(scene.ui.outro, /Computer wins the match/)
  assert.equal(scene.canShoot(1), false)
})

test('both guns and their crews stand on one ground that the shots dig, and a new round levels it', t => {
  const scene = createScene(t)
  assert.equal(scene.terrain.view, scene.battlefield.ground)
  const crew = scene.crews[1]
  const feet = () => crew.y - crew.size.height / 2
  assert.equal(feet(), 0)
  scene.terrain.blast(scene.projection.point(crew).x)
  for (let i = 0; i < 30; i++) scene.update(1 / 30, 0)
  assert.ok(Math.abs(feet() - scene.groundAt(crew.x)) < 1e-9)
  assert.ok(feet() < 0, 'it fell into the crater')

  scene.finishRound(0)
  scene.nextRound()
  assert.equal(scene.groundAt(crew.x), 0)
  assert.deepEqual(scene.battlefield.ground.cuts, [])
  assert.equal(scene.crews[1].y - scene.crews[1].size.height / 2, 0)
})

for (const windEnabled of [false, true])
  for (const terrainEnabled of [false, true])
    test(`wind=${windEnabled} and terrain=${terrainEnabled} affect a landing independently and survive a new round`, t => {
      const scene = createScene(t)
      scene.vsComputer = false
      scene.wind.enabled = windEnabled
      scene.terrain.enabled = terrainEnabled
      scene.wind.strength = .3

      const ball = scene.guns[0].shells.fire({ x: 12.5, y: .25, z: 0 }, 0, -Math.PI / 2, 2.5)
      ball.update(.1)
      ball.strike(ball.firstHit([]))
      assert.equal(ball.state, 'burst', 'the shot really reached the ground')
      assert.equal(scene.terrain.heightAt(500) > scene.terrain.floorY, terrainEnabled)
      // landing stops the ball; its swept path keeps the drift before it
      const drift = ball.path.end.x - ball.path.start.x
      if (windEnabled) assert.ok(drift > 0)
      else assert.ok(Math.abs(drift) < 1e-9)

      scene.finishRound(0)
      scene.nextRound()
      assert.equal(scene.wind.enabled, windEnabled)
      assert.equal(scene.terrain.enabled, terrainEnabled)
      assert.equal(scene.terrain.heightAt(500), scene.terrain.floorY)
      assert.deepEqual(scene.score, [1, 0])
      assert.equal(scene.round, 2)
    })
