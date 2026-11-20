import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Terrain, { craterProfile } from '/scenes/ustanak/Terrain.js'

let Top, Posada, Zastavnik

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
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
