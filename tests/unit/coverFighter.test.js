import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoverFighter, { coverFighter } from '/core/gameplay/controllers/CoverFighter.js'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Body from '/core/gameplay/bodies/Body.js'

const play = (soldier, fighter, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) {
    fighter.update(dt)
    soldier.update(dt)
  }
}

test('a waiting soldier rises to fire at a living target, and ducks after his burst', () => {
  const dead = new Body(), alive = new Body({ health: 1000 })
  dead.takeHit(dead.health.maximum)
  const soldier = new CoverSoldier()
  const fighter = new CoverFighter(soldier, { targets: [dead, alive], random: () => 0 })
  fighter.update(1 / 30)
  assert.equal(soldier.state, 'aim')
  assert.equal(soldier.target, alive)
  play(soldier, fighter, trench.aimTime + coverFighter.burst + .1)
  assert.notEqual(soldier.state, 'attack')
})

test('he does not rise with no one left to fire at, nor while he runs to cover', () => {
  const soldier = new CoverSoldier()
  const fighter = new CoverFighter(soldier, { targets: [], random: () => 0 })
  fighter.update(1)
  assert.equal(soldier.state, 'idle')
  fighter.targets.push(new Body())
  soldier.moveTo({ x: 10, z: 0 })
  fighter.update(1)
  assert.equal(soldier.state, 'move')
})

test('he fires only at a target within his range', () => {
  const far = new Body({ x: 60, health: 1000 }), near = new Body({ x: 40, health: 1000 })
  const soldier = new CoverSoldier()
  const fighter = new CoverFighter(soldier, { targets: [far], range: 50, random: () => 0 })
  fighter.update(1 / 30)
  assert.equal(soldier.state, 'idle')
  fighter.targets.push(near)
  fighter.update(1 / 30)
  assert.equal(soldier.target, near)
})

test('he fires only at a target he sees', () => {
  const hidden = new Body({ x: 10, health: 1000 })
  const soldier = new CoverSoldier()
  const fighter = new CoverFighter(soldier, { targets: [hidden], sees: () => false, random: () => 0 })
  fighter.update(1 / 30)
  assert.equal(soldier.state, 'idle')
})
