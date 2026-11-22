import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character, { character } from '/core/gameplay/bodies/characters/Character.js'
import { rayBoxEntry } from '/core/collision/ray.js'

const near = (actual, expected, within = .02) =>
  assert.ok(Math.abs(actual - expected) <= within, `${actual} is not about ${expected}`)

/** Plays `seconds` of the body at 30 frames a second. */
const play = (body, seconds) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) body.update(1 / 30)
}

test('a civilian can perform an expression but rejects a blow from every public control', () => {
  const target = new Character({ x: 1 })
  const civilian = new Character({ actions: { special: .3 }, targets: [target] })
  assert.ok(!civilian.states.includes('attack'))
  assert.deepEqual(civilian.acts, ['special'])
  civilian.setState('attack')
  civilian.act('attack2')
  civilian.attack()
  assert.equal(civilian.state, 'idle')
  assert.equal(civilian.swing, null)
  civilian.act('special')
  assert.equal(civilian.swing.kind, 'special')
  play(civilian, 1)
  assert.deepEqual([civilian.state, civilian.shotsFired, target.hitsTaken], ['idle', 0, 0])
})

test('changing out of a primary attack stops it and permits a later attack', () => {
  const fighter = new Character({ actions: { attack: .4 } })
  fighter.setState('attack')
  fighter.update(.1)
  fighter.setState('idle')
  play(fighter, .5)
  assert.equal(fighter.shotsFired, 0)
  fighter.setState('attack')
  play(fighter, .5)
  assert.equal(fighter.shotsFired, 1)
  fighter.takeHit(1000)
  fighter.setState('idle')
  assert.equal(fighter.state, 'dead')
})

test('an airship holds its altitude while alive and lands on actual terrain after its loss', () => {
  const airship = new Character({ altitude: 40, groundAt: () => 6, actions: {} })
  play(airship, 1)
  near(airship.feet, 46)
  airship.setState('dead')
  play(airship, .3)
  assert.ok(airship.feet < 46 && airship.feet > 6)
  play(airship, 5)
  near(airship.feet, 6)
  near(airship.vy, 0)
  const bird = new Character({ altitude: 60, levelFlight: true, groundAt: () => 12 })
  near(bird.feet, 60)
  bird.takeHit(1000)
  play(bird, 5)
  near(bird.feet, 12)
})

test('a ray enters a turned box where its side is, and misses one beside it or behind it', () => {
  const box = { x: 5, y: 1, z: 0, yaw: Math.PI / 2, size: { length: 2, height: 2, width: 1 } }
  // turned a quarter, the box is 1 m wide along x
  near(rayBoxEntry({ x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, box), 4.5)
  assert.equal(rayBoxEntry({ x: 0, y: 1, z: 2 }, { x: 1, y: 0, z: 0 }, box), null)
  assert.equal(rayBoxEntry({ x: 0, y: 1, z: 0 }, { x: -1, y: 0, z: 0 }, box), null)
})

test('a character walks, runs and backs at its speeds, and stops when steered still', () => {
  const body = new Character({ speed: 2, run: 2 })
  body.steer({ ahead: 1 })
  assert.equal(body.state, 'move')
  play(body, 1)
  near(body.vx, 2)
  body.steer({ ahead: 1, running: true })
  play(body, 1)
  near(body.vx, 4)
  body.steer({ ahead: -1, running: true })
  play(body, 1)
  near(body.vx, -3)
  body.steer()
  assert.equal(body.state, 'idle')
  play(body, 1)
  near(body.vx, 0)
})

test('a character steps to its right and turns to its left', () => {
  const body = new Character()
  body.steer({ side: 1 })
  play(body, 1)
  assert.ok(body.z > 1, 'facing +x, its right is +z')
  body.steer({ turn: 1, running: true })
  play(body, 1)
  near(body.yaw, character.turn)
})

test('a blow lands halfway through the swing on the nearest target ahead, not on one beside it or behind a wall', () => {
  const target = (x, z) => new Character({ x, z })
  const ahead = target(1.2, 0), farther = target(1.4, 0), beside = target(1.2, 1)
  const body = new Character({ actions: { attack: 1 }, targets: [farther, ahead, beside], random: () => 0 })
  body.attack()
  play(body, .4)
  assert.equal(ahead.hitsTaken, 0, 'not before half the swing')
  play(body, .2)
  assert.deepEqual([ahead.hitsTaken, farther.hitsTaken, beside.hitsTaken], [1, 0, 0])
  assert.equal(ahead.health.current, 100 - character.damage[0])
  assert.equal(body.strike.target, ahead)
  play(body, .5)
  assert.equal(body.state, 'idle', 'the swing over')

  const walled = new Character({ actions: { attack: 1 }, targets: [ahead], obstacleAt: () => .5 })
  walled.attack()
  play(walled, 1)
  assert.equal(walled.shotsFired, 1)
  assert.equal(ahead.hitsTaken, 1, 'the wall took the blow')
  near(walled.strike.to.x, .5)
})

test('a hit that does not kill makes it reel for its pain and breaks off its swing; one that kills lays it dead', () => {
  const body = new Character({ actions: { attack: 1, pain: .5 } })
  body.steer({ ahead: 1 })
  body.attack()
  body.takeHit(10)
  assert.equal(body.state, 'move')
  assert.equal(body.shotsFired, 0, 'pain does not bring the blow forward')
  play(body, .3)
  near(body.vx, 0, .1)
  body.attack()
  assert.equal(body.swing, null, 'no swing while reeling')
  play(body, .6)
  assert.equal(body.shotsFired, 1, 'the interrupted blow still lands at its original time')
  near(body.vx, 2)
  body.takeHit(1000)
  assert.equal(body.state, 'dead')
  body.steer({ ahead: 1 })
  play(body, .5)
  near(body.vx, 0)
})

test('pain interrupts the pose but neither advances nor repeats a pending blow', () => {
  const target = new Character({ x: 1 })
  const body = new Character({ actions: { attack: 2, pain: .5 }, targets: [target], random: () => 0 })
  body.attack()
  body.update(.1)
  body.takeHit(1)
  assert.equal(target.hitsTaken, 0)
  assert.equal(body.swing, null)
  body.update(.4)
  body.takeHit(1)
  body.update(.4)
  assert.equal(target.hitsTaken, 0, 'a second hit neither lands nor resets the pending blow')
  body.update(.11)
  assert.equal(target.hitsTaken, 1)
  body.update(2)
  assert.equal(target.hitsTaken, 1)
  assert.equal(body.shotsFired, 1)
})

test('death cancels an interrupted blow and a new swing replaces its pending blow', () => {
  const target = new Character({ x: 1 })
  const body = new Character({ actions: { attack: 2, attack2: 1, pain: .1 }, targets: [target] })
  body.attack()
  body.update(.1)
  body.takeHit(1)
  body.update(.2)
  body.attack('attack2')
  body.update(.51)
  assert.equal(target.hitsTaken, 1, 'the replacement blow lands at its own midpoint')
  body.update(.3)
  assert.equal(target.hitsTaken, 1, 'the old midpoint does not land another blow')

  body.update(.3)
  body.attack()
  body.update(.1)
  body.takeHit(1)
  body.takeHit(1000)
  body.update(2)
  assert.equal(target.hitsTaken, 1, 'no pending blow lands after death')
})

test('an interrupted area blow waits for its midpoint and a hit after landing does not repeat it', () => {
  const target = new Character({ z: 1 })
  const body = new Character({ actions: { attack: 2 }, area: { kinds: ['attack'] }, targets: [target] })
  body.attack()
  body.update(.1)
  body.takeHit(1)
  assert.equal(target.hitsTaken, 0)
  body.update(.91)
  assert.equal(target.hitsTaken, 1)
  body.takeHit(1)
  body.update(2)
  assert.equal(body.shotsFired, 1)
})

test('it stands on the ground, follows it at its climbing speed and falls from a ledge', () => {
  let ground = 0
  const body = new Character({ groundAt: () => ground })
  near(body.feet, 0, 1e-9)
  ground = .2
  play(body, .05)
  assert.ok(body.feet < .2, 'it climbs, not jumps')
  play(body, .2)
  near(body.feet, .2, 1e-9)
  ground = -3
  assert.ok(body.airborne)
  play(body, 1)
  near(body.feet, -3, 1e-9)
  assert.equal(body.vy, 0)
})

test('a leap lasts its jump, and a flying jump lifts it only while it may push', () => {
  const leaper = new Character({ actions: { jump: .6 } })
  leaper.jump()
  assert.ok(leaper.airborne)
  play(leaper, .7)
  assert.ok(!leaper.airborne)

  const flyer = new Character({ jumping: 'fly', maxLift: .3 })
  let peak = 0, lifted = 0
  for (let i = 0; i < 30; i++) {
    flyer.jump(1 / 30)
    flyer.update(1 / 30)
    peak = Math.max(peak, flyer.feet)
    lifted = Math.max(lifted, flyer.lifted)
  }
  assert.ok(peak > 1, `it rose ${peak} m`)
  near(lifted, .3, 1 / 30)
  play(flyer, 2)
  near(flyer.feet, 0, 1e-9)
})

test('it does not walk into what blocks its way', () => {
  const body = new Character({ isBlocked: (from, direction) => direction.x > 0 })
  body.steer({ ahead: 1 })
  play(body, 1)
  near(body.x, 0, 1e-9)
  assert.ok(body.blocked)
})

test('a fast step checks its whole travel instead of just the body depth', () => {
  const body = new Character({ speed: 40,
    isBlocked: (from, direction, distance) => direction.x > 0 && from.x + distance >= 3 })
  body.steer({ ahead: 1 })
  body.update(.2)
  near(body.x, 0, 1e-9)
  assert.ok(body.blocked)
})

test('an area blow hits every living target around it within reach, and it does not walk into a target', () => {
  const near = new Character({ x: -1 }), far = new Character({ x: 4 }), side = new Character({ z: 2 })
  const body = new Character({ area: { kinds: ['attack'] }, actions: { attack: .5 }, targets: [near, far, side] })
  body.attack()
  play(body, .5)
  assert.deepEqual([near.hitsTaken, far.hitsTaken, side.hitsTaken], [1, 0, 1])

  body.steer({ ahead: 1 })
  body.targets = [new Character({ x: .6 })]
  play(body, 1)
  assert.ok(body.blocked && body.x < .1, `stopped at ${body.x}`)
  body.steer({ ahead: -1 })
  play(body, .5)
  assert.ok(body.x < -.5, 'it can step back from it')
})
