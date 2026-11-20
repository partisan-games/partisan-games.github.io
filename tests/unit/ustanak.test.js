import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Turns from '/scenes/ustanak/Turns.js'

let keyboard

before(async() => {
  createPageElements()
  ;({ keyboard } = await import('/core/io/Keyboard.js'))
})

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

test('the scene routes shared keys only to the active human cannon', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => {
    keyboard.reset()
    scene.end()
  })
  scene.session.start()
  scene.vsComputer = false
  scene.turns.waitForRelease = false
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(scene.top.sila, 450)
  assert.equal(scene.opponent.sila, 300)
  keyboard.pressed.Space = false
  scene.handleInput(.01)
  assert.equal(scene.turns.phase, 'flight')
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(scene.opponent.sila, 300)
  scene.top.granate.projectiles.forEach(shell => shell.reset())
  scene.update(.01, .01)
  assert.equal(scene.turns.active, 1)
  assert.equal(scene.ui.message, 'Player 2\'s turn')
  scene.session.update(1.2)
  scene.handleInput(.5)
  assert.equal(scene.opponent.sila, 300, 'held fire does not transfer to the next player')
  keyboard.pressed.Space = false
  scene.handleInput(.01)
  keyboard.pressed.Space = true
  scene.handleInput(.5)
  assert.equal(scene.opponent.sila, 450)
  assert.equal(scene.top.sila, 300)
})

test('a player can charge and fire while the opening instructions remain visible', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => {
    keyboard.reset()
    scene.end()
  })
  scene.session.start()
  scene.announceTurn()
  scene.handleInput(0)
  keyboard.pressed.Space = true
  scene.handleInput(.2)
  assert.ok(scene.top.sila > scene.top.minSila)
  keyboard.pressed.Space = false
  scene.handleInput(0)
  assert.equal(scene.turns.phase, 'flight')
  assert.equal(scene.top.hasActiveShot, true)
  assert.equal(scene.announcingTurn, true)
  assert.match(scene.ui.messageElement.textContent, /Hold Space/)
})

test('turn announcements inform without blocking play and wait through a pause', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.session.start()
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
  assert.equal(scene.canShoot(1), true)
  scene.session.update(1.2)
  assert.equal(scene.canShoot(1), true)
  scene.vsComputer = false
  scene.turns.active = 0
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.querySelector('h3').textContent, 'Player 1\'s turn')
})

test('round transitions preserve scores, alternate opening sides and cancel old impacts and input', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  scene.session.start()
  scene.vsComputer = false
  t.after(() => {
    keyboard.reset()
    scene.end()
  })
  scene.opponent.width = 100
  scene.opponent.launch()
  const shell = scene.opponent.granate.projectiles[0]
  shell.checkHit({ collidesWith: () => true, takeHit: damage => scene.top.takeHit(damage) })
  scene.top.sila = 700
  scene.opponent.alive = false
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
  assert.equal(scene.opponent.hasActiveShot, false)
  assert.equal(shell.timerId, null)
  assert.equal(scene.top.sila, scene.top.minSila)
  scene.session.update(2)
  assert.equal(scene.top.energija, 100, 'old impact cannot damage the new round')
  assert.equal(scene.opponent.energija, 100)
  scene.top.alive = false
  scene.update(0, 0)
  assert.deepEqual(scene.score, [1, 1])
  scene.nextRound()
  assert.equal(scene.round, 3)
  assert.equal(scene.turns.active, 0)
  scene.opponent.alive = false
  scene.update(0, 0)
  assert.equal(scene.session.state, 'finished')
  assert.match(scene.ui.outro, /Player 1 wins the match/)
  assert.deepEqual(scene.score, [2, 1])
  scene.nextRound()
  scene.update(0, 0)
  assert.equal(scene.round, 3)
  assert.deepEqual(scene.score, [2, 1])
})

test('two computer round wins end the match with a defeat', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  scene.session.start()
  t.after(() => scene.end())
  for (let i = 0; i < 2; i++) {
    scene.top.alive = false
    scene.update(0, 0)
    if (i === 0) scene.nextRound()
  }
  assert.deepEqual(scene.score, [0, 2])
  assert.match(scene.ui.outro, /Game over/)
  assert.match(scene.ui.outro, /Computer wins the match/)
  assert.equal(scene.canShoot(1), false)
})

test('the scene shares one ground between both cannons and their crews, and a new round levels it', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.session.start()
  for (const cannon of [scene.top, scene.opponent])
    assert.ok(cannon.granate.projectiles.every(shell => shell.ground === scene.terrain))
  assert.equal(scene.terrain.view, scene.battlefield.ground)
  const crewY = scene.enemyCrew.y
  scene.terrain.blast(scene.enemyCrew.x)
  scene.update(1)
  assert.equal(scene.enemyCrew.y, crewY + scene.terrain.heightAt(scene.enemyCrew.x) - scene.terrain.floorY)
  assert.ok(scene.enemyCrew.y > crewY)

  scene.finishRound(0)
  scene.nextRound()
  assert.equal(scene.terrain.heightAt(scene.enemyCrew.x), scene.terrain.floorY)
  assert.deepEqual(scene.battlefield.ground.cuts, [])
  assert.equal(scene.enemyCrew.y, crewY)
})

for (const windEnabled of [false, true])
  for (const terrainEnabled of [false, true])
    test(`wind=${windEnabled} and terrain=${terrainEnabled} affect a landing independently and survive a new round`, async t => {
      const Scene = (await import('/scenes/ustanak/Main.js')).default
      const scene = new Scene()
      scene.init()
      scene.clear = () => {}
      t.after(() => scene.end())
      scene.session.start()
      scene.vsComputer = false
      scene.wind.enabled = windEnabled
      scene.terrain.enabled = terrainEnabled
      scene.wind.strength = 12

      const shell = scene.top.granate.projectiles[0]
      shell.launch({ x: 500, y: scene.terrain.floorY - 10 }, Math.PI / 2, 100)
      shell.update(.1)
      shell.resolveFlight([])
      assert.ok(shell.timerId, 'the shot really reached the ground')
      assert.equal(scene.terrain.heightAt(500) > scene.terrain.floorY, terrainEnabled)
      // Landing stops the shell; its swept path preserves the horizontal drift before impact.
      const drift = shell.path.end.x - shell.path.start.x
      if (windEnabled) assert.ok(drift > 0)
      else assert.ok(Math.abs(drift) < 1e-9)

      scene.finishRound(0)
      scene.nextRound()
      assert.equal(scene.wind.enabled, windEnabled)
      assert.equal(scene.terrain.enabled, terrainEnabled)
      assert.equal(scene.terrain.heightAt(500), scene.terrain.floorY)
      assert.equal(shell.timerId, null)
      assert.deepEqual(scene.score, [1, 0])
      assert.equal(scene.round, 2)
    })
