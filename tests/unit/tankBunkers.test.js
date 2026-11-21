import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import spaceBunkers from '/scenes/to-trieste/spaceBunkers.js'

let Bunker, Marksman, GameClock, TenkLevo, CombatTarget, createCannon, shellAngle, firstHit, shellGravity, shellSpeed, canvas2d

before(async() => {
  createPageElements()
  Bunker = (await import('/scenes/to-trieste/Bunker.js')).default
  Marksman = (await import('/core/gameplay/controllers/Marksman.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  CombatTarget = (await import('/scenes/to-trieste/CombatTarget.js')).default
  ;({ createCannon, shellAngle } = await import('/scenes/to-trieste/EnemyWeapons.js'))
  ;({ firstHit } = await import('/scenes/to-trieste/lineOfFire.js'))
  ;({ shellGravity, shellSpeed } = await import('/scenes/tenkici/shellPhysics.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

function battle(options = {}) {
  const clock = new GameClock()
  const target = new TenkLevo({ clock, src: null, cevSlika: null, width: 50, height: 50, x: 100, y: 200 })
  const bunker = new Bunker({ clock, target, src: null, width: 50, height: 50, x: 400, y: 200, groundY: 300, ...options })
  bunker.controller = new Marksman(bunker, target)
  return { clock, target, bunker }
}

test('different-width bunkers keep an edge gap initially and throughout repeated returns', () => {
  const bunkers = [
    battle({ x: 900, width: 300 }).bunker,
    battle({ x: 920, width: 80 }).bunker,
  ]
  spaceBunkers(bunkers, 800)
  assert.ok(bunkers[1].x - bunkers[1].width / 2 - (bunkers[0].x + bunkers[0].width / 2) >= 120)
  for (let index = 0; index < 8; index++) {
    const bunker = bunkers[index % 2]
    const other = bunkers[(index + 1) % 2]
    const life = bunker.lifeId
    bunker.die()
    bunker.x = -bunker.width
    bunker.checkBounds()
    assert.ok(bunker.x - bunker.width / 2 - (other.x + other.width / 2) >= 120)
    assert.ok(bunker.x - bunker.width / 2 > 800)
    assert.equal(bunker.lifeId, life + 1)
    assert.equal(bunker.alive, true)
  }
})

test('machine guns wait, aim at the tank and reuse spent bullets within a burst', () => {
  const { clock, target, bunker } = battle()
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  clock.advance(1.5)
  bunker.update(0)
  const [shot] = bunker.projectiles.projectiles
  assert.ok(shot.dx < 0)
  assert.equal(shot.gravity, 0)
  assert.equal(shot.damage, 3)
  assert.ok(shot.dy < 0)
  assert.ok(shot.x > target.x)
  shot.reset()
  clock.advance(.1)
  bunker.update(0)
  assert.equal(shot.visible, false)
  clock.advance(.04)
  bunker.update(0)
  assert.equal(shot.visible, true)
  assert.equal(bunker.projectiles.projectiles.length, 1)
})

test('machine guns fire a burst of spaced shots and then leave a reload gap', t => {
  const { clock, bunker } = battle()
  const { burstSize, weapon, burst } = bunker.fire.armament
  let shots = 0
  t.mock.method(bunker.projectiles, 'fire', () => shots++)
  clock.advance(1.5)
  bunker.update(0)
  assert.equal(shots, 1)
  for (let i = 1; i < burstSize; i++) {
    clock.advance(weapon.cooldown.seconds + .01)
    bunker.update(0)
  }
  assert.equal(shots, burstSize)
  clock.advance(burst.seconds - .1)
  bunker.update(0)
  assert.equal(shots, burstSize, 'no shot during the reload')
  clock.advance(.2)
  bunker.update(0)
  assert.equal(shots, burstSize + 1)
})

test('offscreen and destroyed bunkers do not fire, but fired shots can still damage the tank', () => {
  const { clock, target, bunker } = battle()
  bunker.x = canvas2d.width + 100
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  bunker.x = 400
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  clock.advance(1.5)
  bunker.update(0)
  const [shot] = bunker.projectiles.projectiles
  bunker.die()
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 1)
  shot.width = shot.height = 10
  shot.setPosition(target.x, target.y)
  const health = target.energija
  bunker.checkHits()
  assert.equal(target.energija, health - shot.damage)
  assert.equal(shot.visible, false)
  bunker.checkHits()
  assert.equal(target.energija, health - shot.damage)
})

test('a new bunker life waits again and a destroyed tank is no longer targeted', () => {
  const { clock, target, bunker } = battle()
  clock.advance(10)
  bunker.die()
  bunker.reset()
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  target.takeHit(100)
  clock.advance(2)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
})

test('partly visible bunkers wait until their firing opening is on screen', () => {
  const { clock, bunker } = battle()
  bunker.x = canvas2d.width + 20
  assert.equal(bunker.shown, true)
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
})

test('cannons use the same shell physics as the tank, with an upward launch and gravity', () => {
  const { clock, target, bunker } = battle({ createWeapon: createCannon })
  clock.advance(1.5)
  bunker.update(0)
  const [shell] = bunker.projectiles.projectiles
  target.fire(target.position, 0)
  const [tankShell] = target.granate.projectiles
  assert.equal(shell.gravity, tankShell.gravity)
  assert.ok(Math.abs(shell.speed - tankShell.speed) < 1e-6)
  assert.equal(shell.groundLevel, 300)
  assert.equal(shell.damage, 20)
  assert.ok(shell.dy < 0)
  shell.width = shell.height = 10
  const initialY = shell.y
  const initialVelocity = shell.dy
  shell.update(.1)
  assert.ok(shell.y < initialY)
  assert.ok(shell.dy > initialVelocity)
})

test('ballistic aim reaches the requested height on either side and rejects unreachable targets', () => {
  const origin = { x: 400, y: 180 }
  for (const target of [{ x: 100, y: 200 }, { x: 700, y: 150 }]) {
    const angle = shellAngle(origin, target)
    assert.notEqual(angle, null)
    const time = (target.x - origin.x) / (shellSpeed * Math.cos(angle))
    const y = origin.y + shellSpeed * Math.sin(angle) * time + shellGravity * time * time / 2
    assert.ok(time > 0)
    assert.ok(Math.abs(y - target.y) < 1e-6)
  }
  assert.equal(shellAngle(origin, { x: 10000, y: 180 }), null)
  assert.equal(shellAngle(origin, origin), null)
})

test('tank-like ballistic aim is almost horizontal nearby and rises into a larger arc at distance', () => {
  const origin = { x: 0, y: 200 }
  const near = shellAngle(origin, { x: 80, y: 200 })
  const far = shellAngle(origin, { x: 1000, y: 200 })
  assert.ok(Math.abs(near) < .02)
  assert.ok(Math.abs(far) > Math.abs(near))
  const peak = angle => (shellSpeed * Math.sin(angle)) ** 2 / (2 * shellGravity)
  assert.ok(peak(near) < 1)
  assert.ok(peak(far) > 40)
})

test('bunkers keep firing through a civilian obstruction and reach the tank after destroying it', () => {
  const { clock, bunker } = battle()
  const cover = new CombatTarget({ src: null, width: 80, height: 120, x: 250, y: 200 })
  bunker.obstacles.push(cover)
  clock.advance(1.5)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 1)
  const [shot] = bunker.projectiles.projectiles
  shot.update(.3)
  bunker.checkHits()
  assert.equal(cover.dead, true)
  assert.equal(bunker.target.energija, 100)
  clock.advance(.14)
  bunker.update(0)
  assert.equal(shot.visible, true)
  shot.update(.6)
  bunker.checkHits()
  assert.equal(bunker.target.energija, 97)
})

test('cover intercepts an already fired bullet crossing an entire building in one frame', () => {
  const { clock, target, bunker } = battle()
  const sources = []
  const cover = new CombatTarget({ src: null, width: 50, height: 120, x: 250, y: 200, callback: source => sources.push(source) })
  clock.advance(1.5)
  bunker.update(0)
  bunker.obstacles.push(cover)
  const [shot] = bunker.projectiles.projectiles
  shot.update(.6)
  bunker.checkHits()
  assert.equal(target.energija, 100)
  assert.equal(shot.visible, false)
  assert.equal(cover.dead, true)
  assert.deepEqual(sources, ['enemy'])
})

test('enemy shells destroy the first building after their impact delay and identify the attacker', () => {
  const { clock, target, bunker } = battle({ createWeapon: createCannon })
  const sources = []
  const cover = new CombatTarget({ src: null, width: 80, height: 120, x: 250, y: 200, callback: source => sources.push(source) })
  bunker.obstacles.push(cover)
  clock.advance(1.5)
  bunker.update(0)
  const [shell] = bunker.projectiles.projectiles
  shell.width = shell.height = 10
  shell.update(.4)
  bunker.checkHits()
  assert.equal(cover.alive, true)
  clock.advance(.15)
  assert.equal(cover.dead, true)
  assert.deepEqual(sources, ['enemy'])
  assert.equal(target.energija, 100)
  assert.equal(shell.visible, false)
})

test('a building behind the tank cannot intercept a hit that reaches the tank first', () => {
  const { clock, target, bunker } = battle()
  clock.advance(1.5)
  bunker.update(0)
  bunker.obstacles.push(new CombatTarget({ src: null, width: 30, height: 120, x: 40, y: 200 }))
  const [shot] = bunker.projectiles.projectiles
  shot.update(.6)
  bunker.checkHits()
  assert.equal(target.energija, 97)
  assert.equal(shot.visible, false)
})

test('cover remains vulnerable to the player and retains its destruction penalty', () => {
  const { clock, target } = battle()
  let penalties = 0
  const cover = new CombatTarget({ src: null, width: 50, height: 120, x: 250, y: 200, callback: () => penalties++ })
  target.granate.fire(cover.position, 0, 0)
  const [shell] = target.granate.projectiles
  shell.width = shell.height = 10
  target.granate.checkHits([cover])
  clock.advance(.15)
  assert.equal(cover.dead, true)
  assert.equal(penalties, 1)
})

test('line-of-fire intersection ignores gaps and destroyed cover, and chooses the nearest hit', () => {
  const near = new CombatTarget({ src: null, width: 20, height: 40, x: 200, y: 200 })
  const far = new CombatTarget({ src: null, width: 20, height: 40, x: 100, y: 200 })
  assert.equal(firstHit({ x: 400, y: 200 }, { x: 0, y: 200 }, [far, near]).target, near)
  assert.equal(firstHit({ x: 400, y: 150 }, { x: 0, y: 150 }, [near]), null)
  near.die()
  assert.equal(firstHit({ x: 400, y: 200 }, { x: 0, y: 200 }, [near]), null)
})

test('a manned bunker fires through its gunner at its door, and he falls and comes back with it', async t => {
  const { default: MachineGunner } = await import('/core/actor/soldiers/MachineGunner.js')
  const { default: GameSession } = await import('/core/runtime/GameSession.js')
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const target = new TenkLevo({ clock: session.clock, src: null, cevSlika: null, width: 50, height: 50, x: 100, y: 200 })
  const gunner = new MachineGunner({ x: 0, y: 0, targets: [target], session })
  const bunker = new Bunker({ clock: session.clock, target, gunner, src: null, width: 50, height: 50, x: 400, y: 200, groundY: 300 })
  bunker.controller = new Marksman(bunker, target)
  assert.equal(bunker.fire, null, 'no hidden gun')
  assert.equal(bunker.projectiles, gunner.bullets)
  bunker.update(0)
  assert.equal(gunner.state, 'fire')
  assert.ok(gunner.x < bunker.x && gunner.y === bunker.y + 25, 'he lies at the door')
  for (let i = 0; i < 40; i++) {
    session.update(.1)
    bunker.update(.1)
    gunner.update(.1)
  }
  assert.ok(gunner.bullets.projectiles.length > 0, 'his bursts are the bunker fire')
  bunker.die()
  bunker.update(0)
  assert.equal(gunner.dead, true)
  bunker.reset()
  assert.equal(gunner.alive, true)
})
