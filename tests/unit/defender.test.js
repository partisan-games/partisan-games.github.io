import { test } from 'node:test'
import assert from 'node:assert/strict'
import Defender from '/core/gameplay/controllers/Defender.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'

const dt = 1 / 30
const play = (body, controller, seconds) => {
  for (let t = 0; t < seconds; t += dt) {
    controller.update(dt)
    body.update(dt)
  }
}

test('a defender shoots down a paratrooper in the air, but not a soldier ducked behind cover', () => {
  const hidden = new CoverSoldier({ x: 30, z: 5, y: .9 })
  hidden.inCover = true
  const falling = new Parachutist({ x: 40, y: 30, z: -10 })
  falling.update = () => {}
  const body = new Character({ walks: false, reach: 300, damage: [200, 200], actions: { attack: .1 },
    pitchRange: { min: -Math.PI / 2, max: Math.PI / 2 }, targets: [hidden, falling] })
  body.y = body.size.height / 2
  const defender = new Defender(body, { enemies: [hidden, falling], spread: 0, random: () => .5 })
  play(body, defender, 4)
  assert.equal(falling.dead, true)
  assert.equal(hidden.alive, true)
})

test('a dead defender fires no more', () => {
  const enemy = new Parachutist({ x: 20, y: 10 })
  const body = new Character({ walks: false, actions: { attack: .1 }, targets: [enemy] })
  body.takeHit(body.health.maximum)
  const defender = new Defender(body, { enemies: [enemy], random: () => 0 })
  play(body, defender, 5)
  assert.equal(body.shotsFired, 0)
})
