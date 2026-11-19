import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import Terrain, { craterProfile } from '/scenes/ustanak/Terrain.js'
import GroundLayer from '/scenes/ustanak/GroundLayer.js'

let Top, Djule, Posada, Zastavnik

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
  Djule = (await import('/scenes/ustanak/Djule.js')).default
  Posada = (await import('/scenes/ustanak/Posada.js')).default
  Zastavnik = (await import('/scenes/ustanak/Zastavnik.js')).default
})

const even = () => .5 // the same uneven crater every time, without ragged columns

test('the crater is a shallow uneven bowl, 120 px wide and about 24 px deep', () => {
  const depths = craterProfile(even)
  assert.equal(depths.length, 60)
  const deepest = Math.max(...depths)
  assert.ok(deepest >= 20 && deepest <= 30, `about 24 px deep: ${deepest}`)
  assert.ok(depths[0] <= 4 && depths.at(-1) <= 4, 'its edges are shallow')
  assert.notEqual(depths[10], depths[49], 'it is not a regular half circle')
  assert.ok(depths.every(depth => depth % 2 === 0), 'pixel-art columns')
})

test('a blast cuts a crater into the ground, a blast in it deepens it to the bottom, and switched off ground stays flat', () => {
  const terrain = new Terrain({ floorY: 500, width: 800, bottom: 560, random: even })
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 524)
  assert.ok(terrain.heightAt(150) > 500 && terrain.heightAt(150) < 524)
  assert.equal(terrain.heightAt(39), 500)
  assert.equal(terrain.heightAt(161), 500)
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 548, 'the second crater starts at the bottom of the first')
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 560, 'never below the bottom of the layer')

  terrain.reset()
  assert.equal(terrain.heightAt(100), 500)
  terrain.enabled = false
  assert.equal(terrain.blast(100), null)
  assert.equal(terrain.heightAt(100), 500)
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

test('units fall with gravity to the ground under their foot, never below it, and stand up on new ground', () => {
  const terrain = new Terrain({ floorY: Top.floorY(468), width: 800, random: even })
  const top = new Top({ x: 300, y: 468, terrain })
  const crew = new Posada(180, 508)
  const bearer = new Zastavnik(60, 501)
  terrain.support(top, crew, bearer)
  const carriageY = top.postolje.y
  const flagY = bearer.flag.y

  terrain.blast(top.footX)
  terrain.blast(crew.x)
  terrain.blast(bearer.x)
  assert.equal(top.y, 468, 'the ground goes first; nothing jumps down')
  terrain.update(0)
  assert.equal(top.y, 468, 'no time, no fall: a paused game stands still')
  terrain.update(1 / 30)
  const early = top.y - 468
  assert.ok(early > 0 && early < terrain.heightAt(top.footX) - terrain.floorY)
  for (let i = 0; i < 60; i++) terrain.update(1 / 30)
  const depth = unit => terrain.heightAt(unit.footX ?? unit.x) - terrain.floorY
  assert.equal(top.y, 468 + depth(top))
  assert.equal(top.postolje.y, carriageY + depth(top), 'the whole cannon falls, carriage too')
  const wheel = top.collider.shapes().find(shape => shape.type === 'circle')
  assert.ok(Math.abs(wheel.y + wheel.r - (terrain.floorY + depth(top))) < 12, 'a hit finds the cannon where it now stands')
  assert.equal(crew.y, 508 + depth(crew))
  assert.equal(bearer.flag.y, flagY + depth(bearer), 'the flag falls with its bearer')

  terrain.reset()
  assert.deepEqual([top.y, top.postolje.y, crew.y, bearer.flag.y], [468, carriageY, 508, flagY])
})

test('the ground layer cuts the same crater floors that Terrain digs', t => {
  const fills = []
  const recorder = {
    globalCompositeOperation: 'source-over',
    clearRect() {},
    createPattern: () => ({ setTransform() {} }),
    fillRect(x, y, width, height) {
      fills.push({ operation: this.globalCompositeOperation, x, y, width, height })
    },
  }
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => recorder)
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  const layer = new GroundLayer({ width: 800, height: 600, floorY: 500 })
  terrain.view = layer
  const cut = terrain.blast(100)
  layer.redraw()
  const holes = fills.filter(fill => fill.operation === 'destination-out')
  assert.equal(holes.length, cut.floors.length)
  holes.forEach((hole, i) => {
    assert.equal(hole.x, cut.left + i * 2)
    assert.equal(hole.height, cut.floors[i] - 7, 'the visible hole ends 7 px above the floor, like the grass above the ground line')
    assert.equal(terrain.heightAt(hole.x), cut.floors[i])
  })
  terrain.reset()
  fills.length = 0
  layer.redraw()
  assert.equal(fills.filter(fill => fill.operation === 'destination-out').length, 0, 'a new round has a whole layer')
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

      const shell = scene.top.projektili[0]
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
