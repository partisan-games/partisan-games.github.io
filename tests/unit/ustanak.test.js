import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import Turns from '/scenes/ustanak/Turns.js'
import CannonAI from '/scenes/ustanak/CannonAI.js'
import Wind from '/scenes/ustanak/Wind.js'
import Terrain from '/scenes/ustanak/Terrain.js'
import WindEffects from '/scenes/ustanak/WindEffects.js'
import VillageFire from '/scenes/ustanak/VillageFire.js'
import PozadinaGrada from '/scenes/tenkici/PozadinaGrada.js'

let Top, Djule, keyboard

// happy-dom has no 2D canvas; the flags draw on the shared context, which is taken when canvas2d.js loads.
const canvasContext = { save() {}, restore() {}, scale() {}, drawImage() {}, imageSmoothingEnabled: true }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => canvasContext)
  Top = (await import('/scenes/ustanak/Top.js')).default
  Djule = (await import('/scenes/ustanak/Djule.js')).default
  ;({ keyboard } = await import('/core/io/Keyboard.js'))
})

test('wind carries smoke and fire particles once, preserves their sources, and stops when disabled', () => {
  const wind = new Wind({ random: () => .75 })
  const effects = new WindEffects(wind)
  const particle = { x: 100, y: 200, dx: 3, vreme: .5 }
  const source = { x: 100, y: 200, burning: true, flame: { sparks: [particle] } }
  effects.update([source, { children: [source] }], .5)
  assert.equal(particle.x, 100 + wind.drift * .5)
  assert.equal(source.x, 100)
  assert.equal(particle.y, 200)
  assert.equal(particle.dx, 3)
  assert.equal(particle.vreme, .5)
  wind.strength *= -1
  effects.update([source], .5)
  assert.equal(particle.x, 100)
  wind.enabled = false
  effects.update([source], 1)
  assert.equal(particle.x, 100)
})

test('smoke in the village and city follows the same signed wind', () => {
  const positions = []
  const ctx = { beginPath() {}, moveTo() {}, arc(x) {
    positions.push(x)
  }, fill() {} }
  const village = new VillageFire()
  village.ctx = ctx
  const city = new PozadinaGrada({ getContext: () => ctx })
  city.crtez = ctx
  const source = { x: .5, y: .5, phase: 1, life: 10, scale: 1, spread: 2, drift: 1, rise: 10, tone: 50 }
  const profile = { izvor: 1, broj: 4, trajanje: 16, speed: 18, vetar: 2, sirenje: 4, vijuganje: 5, seme: 1, nijansa: 36 }
  for (const draw of [speed => village.smoke(2, source, speed), speed => city.gustiDim(2, profile, speed)]) {
    positions.length = 0
    draw(12)
    const right = [...positions]
    positions.length = 0
    draw(-12)
    assert.equal(positions.length, right.length)
    // Smoke born at this moment has not drifted yet.
    assert.ok(right.every((x, i) => x >= positions[i]))
    assert.ok(right.filter((x, i) => x > positions[i]).length > right.length / 2)
  }
})

test('flags share a wave, face the battlefield and keep their cloth inside the screen', async t => {
  const Flag = (await import('/scenes/ustanak/Zastava.js')).default
  const { ctx } = await import('/core/io/canvas2d.js')
  const clock = { time: .25 }
  const flags = [
    new Flag({ x: 59, y: 400, getTime: () => clock.time }),
    new Flag({ x: 1181, y: 400, italian: true, getTime: () => clock.time }),
  ]
  flags.forEach((flag, i) => {
    flag.animation = {}
    flag.animationElapsed = i * .7
    flag.image = { naturalWidth: 488, naturalHeight: 76 }
  })
  const directions = []
  const draws = []
  t.mock.method(ctx, 'scale', x => directions.push(x))
  t.mock.method(ctx, 'drawImage', (...args) => draws.push(args))
  for (const time of [.25, .6]) {
    clock.time = time
    draws.length = directions.length = 0
    flags.forEach(flag => flag.drawFrame())
    assert.deepEqual(directions, [1, -1])
    const middle = draws.length / 2
    assert.deepEqual(draws.slice(0, middle).map(args => args.slice(5)),
      draws.slice(middle).map(args => args.slice(5)), 'both cloths use identical deformations')
    assert.equal(draws[0][1], 0, 'the partisan cloth does not also cycle through baked animation frames')
    flags.forEach((flag, i) => {
      for (const draw of draws.slice(i * middle, (i + 1) * middle)) {
        const x = flag.x + directions[i] * draw[5]
        const end = x + directions[i] * draw[7]
        assert.ok(Math.min(x, end) >= 0 && Math.max(x, end) <= 1280)
      }
    })
  }
})

test('round wind stays constant, can be disabled and is shared by both cannons', () => {
  const wind = new Wind({ random: () => .75 })
  const left = new Top({ x: 200, y: 300, wind })
  const right = new Top({ x: 800, y: 300, wind, direction: -1 })
  const strength = wind.acceleration
  assert.ok(strength >= 8 && strength <= 16)
  for (const cannon of [left, right]) {
    const shell = cannon.projektili[0]
    shell.launch({ x: 500, y: -100 }, 0, 0)
    shell.update(.1)
    assert.equal(shell.dx, strength * .1)
    assert.equal(wind.acceleration, strength)
    wind.enabled = false
    const before = shell.dx
    shell.update(.1)
    assert.equal(shell.dx, before)
    wind.enabled = true
  }
  wind.random = () => .25
  wind.nextRound()
  assert.ok(wind.acceleration < 0, 'a new round may change direction')
})

test('wind does not move a hidden shell or a confirmed impact awaiting damage', () => {
  const session = new GameSession()
  session.start()
  const shell = new Djule({ clock: session.clock, wind: new Wind({ random: () => .75 }) })
  shell.update(.1)
  assert.equal(shell.dx, 0)
  shell.launch({ x: 500, y: 100 }, 0, 300)
  shell.checkHit({ collidesWith: () => true, takeHit() {} })
  const position = { x: shell.x, y: shell.y }
  shell.update(.1)
  assert.deepEqual({ x: shell.x, y: shell.y }, position)
  assert.equal(shell.dx, 0)
  session.dispose()
})

for (const direction of [-1, 1])
  test(`computer compensates for headwind and tailwind facing ${direction}`, () => {
    const wind = new Wind()
    const cannon = new Top({ x: direction === 1 ? 200 : 1000, y: 300, direction, wind })
    const target = new Top({ x: direction === 1 ? 1000 : 200, y: 300 })
    cannon.width = 200
    cannon.minSila = 0
    cannon.maxForce = 10000
    const ai = new CannonAI({ cannon, target, clock: { now: 0 }, random: () => .5 })
    wind.enabled = false
    ai.prepareAim()
    const calm = ai.nextForce
    wind.enabled = true
    wind.strength = 12 * direction
    ai.prepareAim()
    const tailwind = ai.nextForce
    wind.strength *= -1
    ai.prepareAim()
    assert.ok(tailwind < calm, 'tailwind needs less power')
    assert.ok(ai.nextForce > calm, 'headwind needs more power')
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
  const left = new Top({ x: 200, y: 300, clock: session.clock })
  const right = new Top({ x: 800, y: 300, direction: -1, clock: session.clock })
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
  for (const projectile of [...left.projektili, ...right.projektili]) assert.equal(projectile.ground.floorY, a.ground.floorY)
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
  const shell = new Djule({ clock: session.clock, ground: new Terrain({ floorY: 200 }) })
  shell.launch({ x: 100, y: -30 }, -Math.PI / 2, 10)
  shell.update(.1)
  assert.ok(shell.y < -30)
  assert.equal(shell.visible, true)
  shell.setPosition(100, 195)
  shell.dx = 0
  shell.dy = 100
  shell.update(.1)
  shell.resolveFlight([])
  assert.ok(shell.timerId)
  assert.ok(Math.abs(shell.y - 196) < 1e-3, 'it explodes where it reached the ground, not below it')
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

for (const [distance, random] of [[600, .5], [820, .1]])
  test(`the computer corrects its opening miss on its next shot at distance ${distance}`, () => {
    const session = new GameSession()
    session.start()
    const target = new Top({ x: 200, y: 568, clock: session.clock })
    const cannon = new Top({ x: target.x + distance, y: 568, direction: -1, clock: session.clock, targets: [target] })
    for (const gun of [target, cannon]) {
      gun.width = 274 * .75
      gun.height = 52 * .75
    }
    const ai = new CannonAI({ cannon, target, clock: session.clock, random: () => random })
    const forces = []
    const health = []
    const misses = []
    // The real outline leaves room under a raised barrel, so a near miss may need a third shot.
    for (let shot = 0; shot < 3 && target.energija === 100; shot++) {
      session.update(1.2)
      ai.update()
      const shell = cannon.projektili.find(projectile => projectile.visible)
      assert.ok(shell)
      if (shot === 0) {
        // Measured where the shell comes down to the cannon's height: the ground lies lower, under the wheels.
        const flightTime = (-shell.dy + Math.sqrt(shell.dy ** 2
        + 2 * shell.gravity * (target.y - shell.y))) / shell.gravity
        const passingX = shell.x + shell.dx * flightTime
        assert.ok(Math.abs(passingX - target.x) < Math.abs(cannon.x - target.x) * .55,
          `the opening trajectory passes close to the cannon instead of far beyond it: ${passingX}`)
      }
      forces.push(Math.hypot(shell.dx, shell.dy))
      let frames = 0
      while (cannon.hasActiveShot && frames++ < 2400) {
        session.update(1 / 120)
        cannon.update(1 / 120)
        cannon.projektili.forEach(projectile => projectile.update(1 / 120))
        cannon.resolveShots()
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
