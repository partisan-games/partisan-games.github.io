import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import Terrain from '/scenes/ustanak/Terrain.js'

let Top, Djule, Posada, Strelac, Zastavnik

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
  Djule = (await import('/scenes/ustanak/Djule.js')).default
  Posada = (await import('/scenes/ustanak/Posada.js')).default
  Strelac = (await import('/scenes/ustanak/Strelac.js')).default
  Zastavnik = (await import('/scenes/ustanak/Zastavnik.js')).default
})

test('a blast leaves a shallow round crater, a blast in it deepens it up to a limit, and switched off ground stays flat', () => {
  const terrain = new Terrain({ floorY: 500 })
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 506)
  assert.ok(terrain.heightAt(110) > 500 && terrain.heightAt(110) < 506)
  assert.equal(terrain.heightAt(130), 500)
  for (let i = 0; i < 5; i++) terrain.blast(102)
  assert.equal(terrain.craters.length, 1)
  assert.equal(terrain.depthAt(100), 18)
  terrain.blast(300)
  assert.equal(terrain.craters.length, 2)

  terrain.reset()
  assert.equal(terrain.heightAt(100), 500)
  terrain.enabled = false
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 500)
})

test('a shell falls into a crater and explodes at its bottom, making it deeper', () => {
  const session = new GameSession()
  session.start()
  const terrain = new Terrain({ floorY: 500 })
  terrain.blast(100)
  const shell = new Djule({ clock: session.clock, ground: terrain })
  shell.launch({ x: 100, y: 480 }, Math.PI / 2, 300)
  shell.update(.1)
  shell.resolveFlight([])
  assert.ok(shell.timerId)
  assert.ok(Math.abs(shell.y - (506 - shell.r)) < 1e-3)
  assert.equal(terrain.depthAt(100), 12)
  session.dispose()
})

test('a unit sinks with the ground under its foot and stands up again on new ground', () => {
  const terrain = new Terrain({ floorY: Top.floorY(468) })
  const top = new Top({ x: 300, y: 468, terrain })
  const crew = new Posada(180, 508)
  const rifleman = new Strelac(400, 508)
  const bearer = new Zastavnik(60, 501)
  terrain.support(top, crew, rifleman, bearer)
  const wheel = { x: top.footX, y: terrain.floorY - 10 }
  const carriageY = top.postolje.y

  terrain.blast(top.footX)
  assert.equal(top.y, 474)
  assert.equal(top.postolje.y, carriageY + 6, 'the carriage sinks with the barrel')
  const sunk = { x: wheel.x, y: wheel.y + 6 }
  assert.ok(top.collider.shapes().some(shape => shape.type === 'circle' && Math.hypot(shape.x - sunk.x, shape.y - sunk.y) < shape.r))

  terrain.blast(crew.x)
  terrain.blast(rifleman.x)
  terrain.blast(bearer.x)
  assert.deepEqual([crew.y, rifleman.y, bearer.y, bearer.flag.y], [514, 514, 507, 402])

  terrain.reset()
  assert.deepEqual([top.y, top.postolje.y, crew.y, rifleman.y, bearer.y, bearer.flag.y], [468, carriageY, 508, 508, 501, 396])
})

test('the scene shares one ground between both cannons and their crews, and a new round levels it', async t => {
  const Scene = (await import('/scenes/ustanak/Main.js')).default
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.session.start()
  for (const cannon of [scene.top, scene.opponent])
    assert.ok(cannon.projektili.every(shell => shell.ground === scene.terrain))
  const crewY = scene.enemyCrew.y
  scene.terrain.blast(scene.enemyCrew.x)
  assert.equal(scene.enemyCrew.y, crewY + 6)

  scene.finishRound(0)
  scene.nextRound()
  assert.deepEqual(scene.terrain.craters, [])
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

      const shell = scene.top.projektili[0]
      shell.launch({ x: 500, y: scene.terrain.floorY - 10 }, Math.PI / 2, 100)
      shell.update(.1)
      shell.resolveFlight([])
      assert.ok(shell.timerId, 'the shot really reached the ground')
      assert.equal(scene.terrain.craters.length, terrainEnabled ? 1 : 0)
      // Landing stops the shell; its swept path preserves the horizontal drift before impact.
      const drift = shell.path.end.x - shell.path.start.x
      if (windEnabled) assert.ok(drift > 0)
      else assert.ok(Math.abs(drift) < 1e-9)

      scene.finishRound(0)
      scene.nextRound()
      assert.equal(scene.wind.enabled, windEnabled)
      assert.equal(scene.terrain.enabled, terrainEnabled)
      assert.deepEqual(scene.terrain.craters, [])
      assert.equal(shell.timerId, null)
      assert.deepEqual(scene.score, [1, 0])
      assert.equal(scene.round, 2)
    })
