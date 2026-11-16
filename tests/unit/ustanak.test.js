import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import Turns from '/scenes/ustanak/Turns.js'
import CannonAI from '/scenes/ustanak/CannonAI.js'

let Top, Djule, keyboard

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
  Djule = (await import('/scenes/ustanak/Djule.js')).default
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

test('opposing cannons launch at mirrored positions and velocities, against the same ground', () => {
  const session = new GameSession()
  const left = new Top({ x: 200, y: 300, clock: session.clock, groundY: 332 })
  const right = new Top({ x: 800, y: 300, direction: -1, clock: session.clock, groundY: 332 })
  left.width = right.width = 100
  assert.ok(Math.abs(left.vrhX + right.vrhX - 1000) < 1e-9)
  assert.ok(Math.abs(left.vrhY - right.vrhY) < 1e-9)
  assert.equal(left.launch(), true)
  assert.equal(right.launch(), true)
  const a = left.projektili[0], b = right.projektili[0]
  assert.ok(Math.abs(a.dx + b.dx) < 1e-9)
  assert.ok(Math.abs(a.dy - b.dy) < 1e-9)
  assert.ok(a.dy < 0 && b.dy < 0)
  assert.equal(left.launch(), false, 'one cannon cannot overlap its shots')
  for (const projectile of [...left.projektili, ...right.projektili]) assert.equal(projectile.groundLevel, 332)
})

test('charging depends on elapsed time, has a maximum and uses the same aiming direction on either side', t => {
  t.after(() => keyboard.reset())
  keyboard.pressed.Space = true
  const a = new Top({ x: 200, y: 300 })
  const b = new Top({ x: 800, y: 300, direction: -1 })
  for (let i = 0; i < 30; i++) a.handleInput(1 / 30)
  for (let i = 0; i < 60; i++) b.handleInput(1 / 60)
  assert.ok(Math.abs(a.sila - b.sila) < 1e-9)
  a.handleInput(100)
  assert.equal(a.sila, a.maxForce)
  keyboard.pressed.KeyW = true
  a.handleInput(.1)
  b.handleInput(.1)
  assert.ok(Math.abs(a.elevation - b.elevation) < 1e-9)
})

test('an impact keeps the turn until delayed damage resolves', () => {
  const session = new GameSession()
  session.start()
  const cannon = new Top({ x: 200, y: 300, clock: session.clock })
  cannon.width = 100
  cannon.launch()
  let hits = 0
  cannon.projektili[0].checkHit({ collidesWith: () => true, takeHit: () => hits++ })
  session.update(.14)
  assert.equal(cannon.hasActiveShot, true)
  assert.equal(hits, 0)
  session.update(.02)
  assert.equal(cannon.hasActiveShot, false)
  assert.equal(hits, 1)
})

test('a high artillery arc keeps moving above the screen and a ground miss settles its explosion', () => {
  const session = new GameSession()
  session.start()
  const shell = new Djule({ clock: session.clock, groundLevel: 200 })
  shell.launch({ x: 100, y: -30 }, -Math.PI / 2, 10)
  shell.update(.1)
  assert.ok(shell.y < -30)
  assert.equal(shell.visible, true)
  shell.setPosition(100, 199)
  shell.dx = shell.dy = 0
  shell.update(.01)
  assert.ok(shell.timerId)
  session.update(.16)
  assert.equal(shell.visible, false)
  assert.equal(shell.timerId, null)
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
  scene.top.projektili.forEach(shell => shell.reset())
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

test('turn announcements name the chosen mode, block input and wait through a pause', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.session.start()
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.textContent, 'Your turn')
  assert.equal(scene.canShoot(0), false)
  scene.session.pause()
  scene.session.update(100)
  assert.equal(scene.ui.messageElement.textContent, 'Your turn')
  scene.session.resume()
  scene.session.update(1.2)
  assert.equal(scene.ui.messageElement.textContent, '')
  assert.equal(scene.canShoot(0), true)
  scene.turns.fire(0)
  scene.turns.settle(false)
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.textContent, 'Computer\'s turn')
  assert.equal(scene.canShoot(1), false)
  scene.session.update(1.2)
  assert.equal(scene.canShoot(1), true)
  scene.vsComputer = false
  scene.turns.active = 0
  scene.announceTurn()
  assert.equal(scene.ui.messageElement.textContent, 'Player 1\'s turn')
})

for (const [distance, random] of [[600, .5], [820, .1]])
  test(`the computer corrects its opening miss on its next shot at distance ${distance}`, () => {
    const session = new GameSession()
    session.start()
    const target = new Top({ x: 200, y: 568, clock: session.clock, groundY: 600 })
    const cannon = new Top({ x: target.x + distance, y: 568, direction: -1, clock: session.clock, groundY: 600, targets: [target] })
    for (const gun of [target, cannon]) {
      gun.width = 200
      gun.height = 40
      gun.postolje.width = 200
      gun.postolje.height = 60
    }
    const ai = new CannonAI({ cannon, target, clock: session.clock, random: () => random })
    const forces = []
    const health = []
    const misses = []
    for (let shot = 0; shot < 2 && target.energija === 100; shot++) {
      session.update(1.2)
      ai.update()
      const shell = cannon.projektili.find(projectile => projectile.visible)
      assert.ok(shell)
      if (shot === 0) {
        const flightTime = (-shell.dy + Math.sqrt(shell.dy ** 2
        + 2 * shell.gravity * (shell.groundLevel - shell.r - shell.y))) / shell.gravity
        const landingX = shell.x + shell.dx * flightTime
        assert.ok(Math.abs(landingX - target.x) < Math.abs(cannon.x - target.x) * .55,
          `the opening trajectory stays close instead of landing far beyond the screen: ${landingX}`)
      }
      forces.push(Math.hypot(shell.dx, shell.dy))
      let frames = 0
      while (cannon.hasActiveShot && frames++ < 2400) {
        session.update(1 / 120)
        cannon.update(1 / 120)
        cannon.projektili.forEach(projectile => projectile.update(1 / 120))
      }
      assert.equal(cannon.hasActiveShot, false, 'the shot must finish')
      health.push(target.energija)
      misses.push(Math.sign(cannon.direction * (target.x - shell.x)))
      ai.beginTurn()
    }
    assert.equal(health[0], 100, 'the opening shot is not a near-perfect solution')
    assert.ok((forces[1] - forces[0]) * misses[0] > 0, 'power corrects in the direction of the miss')
    assert.ok(health.at(-1) < 100, 'corrections eventually find the target')
    assert.ok(health.length >= 2, 'the computer corrects its opening miss')
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
  const shell = scene.opponent.projektili[0]
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

test('computer ranging does not bypass turn permission or spend its wait during pause', () => {
  const session = new GameSession()
  session.start()
  let allowed = false, shots = 0
  const cannon = new Top({ x: 800, y: 300, direction: -1, clock: session.clock,
    canFire: () => allowed && session.state === 'running', onFire: () => shots++ })
  cannon.width = 100
  const target = new Top({ x: 200, y: 300 })
  const ai = new CannonAI({ cannon, target, clock: session.clock, random: () => .5 })
  session.update(.6)
  session.pause()
  session.update(100)
  ai.update()
  assert.equal(shots, 0)
  session.resume()
  session.update(.6)
  ai.update()
  assert.equal(shots, 0, 'a ready AI still needs permission from the scene')
  allowed = true
  ai.update()
  ai.update()
  assert.equal(shots, 1)
  cannon.projektili.forEach(projectile => projectile.reset())
  session.finish()
  ai.update()
  assert.equal(shots, 1)
})
