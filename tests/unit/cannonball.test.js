import { test } from 'node:test'
import assert from 'node:assert/strict'
import Cannonball, { cannonball } from '/core/gameplay/bodies/projectiles/Cannonball.js'
import Terrain from '/scenes/ustanak/Terrain.js'

const even = () => .5 // the same uneven crater every time, without ragged columns

/** A ball over ground whose craters a `terrain` in pixels, y down, keeps at 10 px a metre, with its floor at 0 m. */
function overGround(options = {}) {
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  const ball = new Cannonball({ groundAt: x => (500 - terrain.heightAt(x * 10)) / 10, onBlast: x => terrain.blast(x * 10), ...options })
  /** One step of flight, ended by whatever it reaches first. */
  const step = (dt, targets = []) => {
    ball.update(dt)
    const hit = ball.firstHit(targets)
    if (hit) ball.strike(hit)
  }
  return { ball, terrain, step }
}

test('the wind carries a flying ball, not a bursting one', () => {
  const wind = { acceleration: 1.2 }
  const { ball, step } = overGround({ wind })
  ball.launch({ x: 50, y: 30, z: 0 }, 0, 0, 0)
  step(.1)
  assert.ok(Math.abs(ball.vx - .12) < 1e-9)
  ball.strike({ target: { alive: true, takeHit() {} }, time: 1 })
  const { x, y } = ball
  ball.update(.1)
  assert.deepEqual([ball.x, ball.y, ball.vx], [x, y, 0])
})

test('a high arc leaves the top and comes back, and a miss bursts where it reaches the ground, then leaves play', () => {
  const { ball, step } = overGround()
  ball.launch({ x: 10, y: 300, z: 0 }, 0, Math.PI / 2, 1)
  step(.1)
  assert.ok(ball.y > 300 && ball.active)
  Object.assign(ball, { y: .5, vx: 0, vy: -10 })
  step(.1)
  assert.equal(ball.state, 'burst')
  assert.ok(Math.abs(ball.y - cannonball.radius) < 1e-3, 'it bursts where it reached the ground, not below it')
  ball.update(cannonball.burst)
  assert.equal(ball.active, false)
})

test('a ball falls into a crater and bursts at its bottom, making it deeper', () => {
  const { ball, terrain, step } = overGround()
  terrain.blast(100)
  ball.launch({ x: 10, y: 2, z: 0 }, 0, -Math.PI / 2, 30)
  step(.2)
  assert.equal(ball.state, 'burst')
  assert.ok(Math.abs(ball.y - (-2.4 + cannonball.radius)) < 1e-3)
  assert.equal(terrain.heightAt(100), 548)
})

test('a hit bursts on the target, which takes the damage once the burst is over, and digs a crater beneath it', () => {
  const { ball, terrain, step } = overGround()
  const target = { x: 40, y: 3, size: { length: 4, height: 4, width: 4 }, alive: true, dead: false, hits: 0,
    takeHit() {
      this.hits++
    } }
  ball.launch({ x: 30, y: 3, z: 0 }, 0, 0, 100)
  step(.2, [target])
  assert.equal(ball.state, 'burst')
  assert.equal(terrain.heightAt(380), 524)
  ball.update(cannonball.burst)
  assert.equal(target.hits, 1)
})

test('a ball flying low across a crater stops on its far wall, not inside the earth', () => {
  const { ball, terrain, step } = overGround()
  terrain.blast(100)
  ball.launch({ x: 10, y: -1.2, z: 0 }, 0, 0, 60)
  const before = terrain.heights.slice()
  step(.1)
  assert.equal(ball.state, 'burst', 'it hit the wall')
  assert.ok(ball.x > 10 && ball.x < 16)
  assert.ok(Math.abs(ball.y - cannonball.radius - (500 - before[Math.floor(ball.x * 10)]) / 10) <= .2, 'it stopped where the wall was')
})

test('a ball that leaves a side of its bounds leaves play without a burst', () => {
  const blasts = []
  const { ball, step } = overGround({ bounds: { min: 0, max: 80 }, onBlast: x => blasts.push(x) })
  ball.launch({ x: 78, y: 30, z: 0 }, 0, 0, 100)
  step(.1)
  assert.equal(ball.active, false)
  assert.deepEqual(blasts, [])
})
