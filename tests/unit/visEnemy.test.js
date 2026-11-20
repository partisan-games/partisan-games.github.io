import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Enemy, enemy, Flame, canvas2d

before(async() => {
  createPageElements()
  ;({ default: Enemy, enemy } = await import('/scenes/vis/Enemy.js'))
  Flame = (await import('/core/actor/Flame.js')).default
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

/** A game session that runs, as in a started game. */
const startedSession = t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  return session
}

/** Lets the plane live, and the game clock with it. */
const live = (plane, seconds, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) {
    plane.session.update(1 / fps)
    plane.update(1 / fps, 0)
  }
}

/** A plane alone on the screen, above a living target, with its guns reloaded. */
function createPlane(t, options) {
  const plane = new Enemy({ session: startedSession(t), ...options })
  plane.setPosition(canvas2d.width / 2, canvas2d.height / 4)
  const target = { x: canvas2d.width / 4, y: canvas2d.height * .8, alive: true }
  plane.targets.push(target)
  plane.weapon.cooldown.start(0)
  return { plane, target }
}

const shown = plane => plane.bullets.projectiles.filter(shot => shot.visible)

test('an enemy plane stands where it is put and holds fire until it is set to fire', t => {
  const { plane } = createPlane(t)
  assert.deepEqual(plane.states, ['idle', 'fire', 'dead'])
  assert.equal(plane.state, 'idle')
  const { x, y } = plane
  live(plane, 1)
  assert.deepEqual([plane.x, plane.y], [x, y])
  assert.equal(shown(plane).length, 0)
})

test('set to fire, an enemy plane shoots where it aims at its bullet speed, and again only after a reload', t => {
  const { plane, target } = createPlane(t)
  assert.equal(plane.aimAt(target), true)
  let shots = 0
  const spawn = plane.weapon.spawnProjectile
  plane.weapon.spawnProjectile = (...shot) => {
    shots++
    spawn(...shot)
  }
  plane.setState('fire')
  plane.update(1 / 60, 0)

  const [bullet] = shown(plane)
  const aim = Math.atan2(target.y - plane.y, target.x - plane.x)
  const flight = Math.atan2(bullet.dy, bullet.dx)
  assert.ok(Math.abs(flight - aim) < .05, `aimed at ${aim}, flies at ${flight}`)
  assert.ok(Math.abs(Math.hypot(bullet.dx, bullet.dy) - enemy.bulletSpeed) < 1e-9)

  live(plane, plane.fireInterval * .7)
  assert.equal(shots, 1, 'not before the shortest reload')
  live(plane, plane.fireInterval * .6)
  assert.equal(shots, 2, 'after the longest one')
})

test('an enemy plane aims at a point that moves, and fires where the point is at the shot', t => {
  const { plane, target } = createPlane(t)
  plane.aimAt(target)
  plane.setState('fire')
  target.x = canvas2d.width * .75
  plane.update(1 / 60, 0)
  const [bullet] = shown(plane)
  assert.ok(bullet.dx > 0, 'towards where the target has gone')
})

test('an enemy plane can fire only from the screen', t => {
  const { plane, target } = createPlane(t)
  plane.setPosition(-100, canvas2d.height / 4)
  assert.equal(plane.aimAt(target), false)
})

test('a shot down plane does not shoot, even when set to fire', t => {
  const { plane, target } = createPlane(t)
  plane.aimAt(target)
  plane.die()
  assert.equal(plane.state, 'dead')
  plane.setState('fire')
  plane.update(1 / 60, 0)
  assert.equal(shown(plane).length, 0)
})

test('a controller takes the plane\'s step before the plane fires, so the shot leaves from where it has flown', t => {
  const { plane, target } = createPlane(t)
  plane.controller = {
    update: () => {
      plane.x = 100
      plane.aimAt(target)
      plane.setState('fire')
    },
  }
  plane.update(1 / 60, 0)
  const [bullet] = shown(plane)
  assert.ok(Math.abs(bullet.x - 100) < 10, `from ${bullet.x}`)
})

test('the engine of a living plane runs unless the world silences it', t => {
  const { plane } = createPlane(t)
  plane.update(1 / 60, 0)
  assert.equal(plane.engineSound.desired, true)
  plane.engineRunning = false
  plane.update(1 / 60, 0)
  assert.equal(plane.engineSound.desired, false)
  plane.engineRunning = true
  plane.die()
  plane.update(1 / 60, 0)
  assert.equal(plane.engineSound.desired, false, 'a shot down plane is silent')
})

test('a plane that has flown onto the screen and far out again is gone', t => {
  const { plane } = createPlane(t)
  plane.setPosition(-100, 100)
  plane.update(1 / 60, 0)
  assert.equal(plane.gone, false, 'not before it was on the screen')
  plane.setPosition(100, 100)
  plane.update(1 / 60, 0)
  plane.setPosition(-100, 100)
  plane.update(1 / 60, 0)
  assert.equal(plane.gone, false, 'just past the edge')
  plane.setPosition(-200, 100)
  plane.update(1 / 60, 0)
  assert.equal(plane.gone, true)
})

test('a heavy plane takes five hits and burns after half of them; a fighter falls from one, and each has its points', async t => {
  const session = startedSession(t)
  const heavy = new Enemy({ session, type: 'heavy' })
  const fighter = new Enemy({ session })
  // a plane's flame comes in a module of its own, loaded when the plane is made
  for (let i = 0; i < 100 && !heavy.flammable; i++) await new Promise(resolve => {
    setTimeout(resolve, 10)
  })

  for (let i = 0; i < 4; i++) heavy.takeHit(15)
  assert.equal(heavy.alive, true, 'four hits')
  assert.equal(heavy.burning, true, 'on fire after half of its hits')
  heavy.takeHit(15)
  assert.equal(heavy.alive, false, 'down at the fifth')

  fighter.takeHit(15)
  assert.equal(fighter.alive, false)
  assert.equal(heavy.points, 500)
  assert.equal(fighter.points, 100)
})

test('a shot down plane goes on straight ahead at its speed, shrinks as it falls, and after its fall time it is gone', t => {
  const { plane } = createPlane(t)
  plane.face(0) // nose to the right
  const { x, scaleX } = plane
  plane.setState('dead')
  assert.equal(plane.alive, false, 'set dead, it is shot down')
  live(plane, 1)
  assert.ok(Math.abs(plane.x - (x + plane.flightSpeed)) < 1, 'ahead at its speed')
  assert.ok(plane.scaleX < scaleX)
  live(plane, enemy.fallTime - 1.1)
  assert.equal(plane.gone, false, 'still falling')
  live(plane, .2)
  assert.equal(plane.gone, true)
})

test('enemy ignition starts at its current position and preserves an already burning trail on death', t => {
  const plane = new Enemy({ session: startedSession(t), type: 'heavy' })
  plane.flame = new Flame(100, 100)
  plane.flame.update(1 / 60)
  plane.setPosition(500, 350)
  plane.damage(plane.maxHits / 2)
  assert.equal(plane.flame.sparks.length, 0)
  assert.deepEqual([plane.flame.x, plane.flame.y], [500, 350])
  plane.updateFlame(1 / 60)
  const trail = [...plane.flame.sparks]
  assert.ok(trail.length > 0)
  plane.damage(plane.maxHits)
  assert.equal(plane.dead, true)
  assert.deepEqual(plane.flame.sparks, trail)
})
