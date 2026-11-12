import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene } from 'three'
import AI from '/core3d/actor/AI.js'
import { damageAt } from '/core/gameplay/damage.js'

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

/** An attacker without animations whose forward ray meets a target 1.5 away. */
function createFight() {
  const scene = new Scene()
  const target = createBody(2)
  target.name = 'player'
  target.position.z = 1.5
  const attacker = new AI({ mesh: createBody(2), baseState: 'idle', attackDistance: 3, attackStyle: 'ONCE', target })
  scene.add(attacker.mesh, target)
  attacker.intersect = () => [{ point: target.position, object: target, distance: 1.5 }]
  return { attacker, target }
}

test('a blow does damage in its range only, without any model', () => {
  const roll = () => 40
  assert.equal(damageAt({ distance: 2, reach: 3, roll }), 40)
  assert.equal(damageAt({ distance: 3.1, reach: 3, roll }), 0)
  for (let i = 0; i < 50; i++) {
    const damage = damageAt({ distance: 0, reach: 1, range: [35, 55] })
    assert.ok(Number.isInteger(damage) && damage >= 35 && damage <= 55, `${damage}`)
  }
})

test('a blow lands halfway through the attack, on game time', () => {
  const { attacker, target } = createFight()
  attacker.enterAttack('player')
  attacker.clock.advance(.19)
  assert.equal(target.userData.damageAmount, undefined)
  attacker.clock.advance(.01)
  assert.ok(target.userData.damageAmount > 0)
})

test('an attacker that dies before its blow lands does no damage, and one in pain still does', () => {
  const dying = createFight()
  dying.attacker.enterAttack('player')
  dying.attacker.mesh.userData.damageAmount = 1000
  dying.attacker.checkHit()
  dying.attacker.clock.advance(1)
  assert.equal(dying.target.userData.damageAmount, undefined)

  const hurt = createFight()
  hurt.attacker.enterAttack('player')
  hurt.attacker.mesh.userData.damageAmount = 10
  hurt.attacker.checkHit()
  assert.ok(!hurt.attacker.dead)
  hurt.attacker.clock.advance(1)
  assert.ok(hurt.target.userData.damageAmount > 0)
})

test('a player attack without animation ends after .3 s of the player game time, not of the wall clock', async t => {
  const { default: Player } = await import('/core3d/actor/Player.js')
  const player = new Player({ mesh: createBody(2), attackStyle: 'ONCE' })
  t.after(() => player.end())
  player.enterAttack = () => {}
  player.setState('attack')
  for (let i = 0; i < 17; i++) player.update(1 / 60)
  assert.equal(player.state, 'attack', 'still attacking after .28 s')
  for (let i = 0; i < 2; i++) player.update(1 / 60)
  assert.notEqual(player.state, 'attack')
})
