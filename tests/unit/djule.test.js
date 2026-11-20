import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import Wind from '/scenes/ustanak/Wind.js'
import Terrain from '/scenes/ustanak/Terrain.js'

let Djule

before(async() => {
  createPageElements()
  Djule = (await import('/scenes/ustanak/Djule.js')).default
})

const even = () => .5 // the same uneven crater every time, without ragged columns

test('wind does not move a hidden shell or a confirmed impact awaiting damage', () => {
  const session = new GameSession()
  session.start()
  const shell = new Djule({ clock: session.clock, wind: new Wind({ random: () => .75 }), ground: new Terrain({ floorY: 500 }) })
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

test('a shell falls into a crater and explodes at its bottom, making it deeper', () => {
  const session = new GameSession()
  session.start()
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  terrain.blast(100)
  const shell = new Djule({ clock: session.clock, ground: terrain })
  shell.launch({ x: 100, y: 480 }, Math.PI / 2, 300)
  shell.update(.2)
  shell.resolveFlight([])
  assert.ok(shell.timerId)
  assert.ok(Math.abs(shell.y - (524 - shell.r)) < 1e-3)
  assert.equal(terrain.heightAt(100), 548)
  session.dispose()
})

test('a shell that hits a target leaves a crater in the ground beneath the hit, once', () => {
  const session = new GameSession()
  session.start()
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  const shell = new Djule({ clock: session.clock, ground: terrain })
  shell.launch({ x: 300, y: 470 }, 0, 100)
  const target = { collidesWith: () => true, takeHit() {} }
  shell.strike(target)
  assert.equal(terrain.heightAt(300), 524)
  shell.strike(target)
  assert.equal(terrain.heightAt(300), 524, 'a second strike of the same shell digs nothing')
  session.dispose()
})

test('a shell flying low across a crater stops on its far wall, not inside the earth', () => {
  const session = new GameSession()
  session.start()
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  terrain.blast(100)
  const shell = new Djule({ clock: session.clock, ground: terrain })
  shell.launch({ x: 100, y: 512 }, 0, 600)
  shell.dy = 0
  shell.update(.1)
  const before = terrain.heights.slice()
  shell.resolveFlight([])
  assert.ok(shell.timerId, 'it hit the wall')
  assert.ok(shell.x > 100 && shell.x < 160)
  assert.ok(Math.abs(shell.y + shell.r - before[Math.floor(shell.x)]) <= 2, 'it stopped where the wall was')
  session.dispose()
})
