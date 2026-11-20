import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Strelac, rifle, Posada

before(async() => {
  createPageElements()
  ;({ default: Strelac, rifle } = await import('/scenes/ustanak/Strelac.js'))
  ;({ default: Posada } = await import('/scenes/ustanak/Posada.js'))
})

const live = (block, seconds) => {
  const poses = new Set()
  for (let i = 0; i < seconds * 30; i++) {
    block.update(1 / 30)
    poses.add(block.animation.name)
  }
  return poses
}

test('a rifleman stands until set to fire, then fires again and again and stays firing', () => {
  const soldier = new Strelac(200, 300)
  soldier.onload()
  assert.deepEqual(soldier.states, ['idle', 'fire'])
  assert.deepEqual([...live(soldier, rifle.interval * 2)], ['idle'], 'he stands')
  soldier.setState('fire')
  assert.deepEqual([...live(soldier, rifle.interval + .1)].sort(), ['fire', 'idle'], 'he fires, then stands again')
  assert.equal(soldier.state, 'fire', 'he keeps firing')
})

test('a gun crew stands by, loads while set to, and after a shot and its recoil stands by again', () => {
  const crew = new Posada(100, 300)
  crew.onload()
  assert.deepEqual(crew.states, ['idle', 'load', 'fire'])
  crew.setState('load')
  assert.deepEqual([...live(crew, 2)], ['load'], 'it keeps loading')
  crew.fire()
  assert.equal(crew.state, 'fire')
  const poses = live(crew, 2)
  assert.ok(poses.has('fire') && poses.has('recoil'))
  assert.equal(crew.state, 'idle')
  assert.equal(crew.animation.name, 'idle')
})
