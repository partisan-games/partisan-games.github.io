import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Obala, Defenses, MachineGun, Target, platno
before(async() => {
  createPageElements()
  Obala = (await import('/scenes/camac/Obala.js')).default
  Defenses = (await import('/scenes/camac/ShoreDefenses.js')).default
  MachineGun = (await import('/scenes/camac/ShoreMachineGun.js')).default
  Target = (await import('/scenes/camac/CombatTarget.js')).default
  platno = (await import('/core/io/platno.js')).default
})

function setup(t) {
  const session = new GameSession()
  t.after(() => session.dispose())
  session.start()
  const target = new Target({ session, viewLeft: () => 0, src: null,
    x: 400, y: 200, sirina: 60, visina: 24, maximum: 100 })
  return { session, target }
}

test('shore positions fit the actual coast and remain fixed while the camera moves', t => {
  const { session, target } = setup(t)
  let cameraX = 0
  const coast = new Obala(() => cameraX)
  coast.seed = 42
  const defenses = new Defenses({ session, target, coast, viewLeft: () => cameraX })
  for (const post of defenses.positions) {
    assert.equal(post.vidljiv, true)
    for (let x = post.x - post.sirina / 2; x <= post.x + post.sirina / 2; x++) {
      const edge = coast.edgeAt(x, post.side)
      if (post.side < 0) assert.ok(post.y + post.visina / 2 < edge)
      else assert.ok(post.y - post.visina / 2 > edge)
    }
    assert.ok(post.y - post.visina / 2 >= 1 && post.y + post.visina / 2 <= platno.height - 1)
  }
  const positions = defenses.positions.map(p => [p.x, p.y, p.lifeId])
  cameraX = 100
  defenses.update()
  assert.deepEqual(defenses.positions.map(p => [p.x, p.y, p.lifeId]), positions)
  const post = defenses.positions[0]
  post.reagujNaPogodak(30)
  assert.equal(post.dead, true)
  cameraX = Math.max(...defenses.positions.map(p => p.x)) + platno.width * 2
  defenses.update()
  assert.equal(defenses.positions.length, 2)
  assert.equal(post.alive, true)
  assert.ok(post.lifeId > positions[0][2])
  assert.ok(post.x > cameraX + platno.width)
})

test('the gun waits, fires four rounds from its visible barrel, rests and stops on death or pause', t => {
  const { session, target } = setup(t)
  const post = new MachineGun({ session, target, viewLeft: () => 0 })
  post.deploy(400, 20, -1)
  post.update(0)
  assert.equal(post.bullets.projectiles.some(p => p.vidljiv), false)
  session.update(.41)
  const muzzle = post.muzzle
  post.update(0)
  const first = post.bullets.projectiles[0]
  assert.equal(first.x, muzzle.x)
  assert.equal(first.y, muzzle.y)
  assert.equal(first.ugao, post.gunAngle)
  assert.equal(first.steta, 3)
  for (let i = 0; i < 3; i++) { session.update(.15); post.update(0) }
  const count = () => post.bullets.projectiles.filter(p => p.vidljiv).length
  assert.equal(count(), 4)
  session.update(1)
  post.update(0)
  assert.equal(count(), 4, 'a complete burst is followed by a long pause')
  session.pause()
  session.update(10)
  post.update(1)
  assert.equal(count(), 4)
  session.resume()
  post.reagujNaPogodak(30)
  session.update(10)
  post.update(1)
  assert.equal(count(), 4, 'death prevents new fire but does not erase existing shots')
})

test('a coastal gun does not shoot through the landward side of its position', t => {
  const { session, target } = setup(t)
  const post = new MachineGun({ session, target, viewLeft: () => 0 })
  post.deploy(400, 40, -1)
  target.y = 10
  for (let i = 0; i < 10; i++) { session.update(1); post.update(.1) }
  assert.equal(post.bullets.projectiles.some(p => p.vidljiv), false)
})

test('destruction ignites once, pauses, and clears before the position is reused', t => {
  const { session, target } = setup(t)
  const post = new MachineGun({ session, target, viewLeft: () => 0 })
  post.deploy(400, 30, -1)
  const oldLife = post.lifeId
  post.reagujNaPogodak(30)
  const ignition = post.destruction.startedAt
  assert.equal(post.dead, true)
  post.update(.1)
  const particles = post.destruction.flame.iskre
  assert.ok(particles.length > 0)
  const age = particles[0].vreme
  session.pause()
  session.update(2)
  post.update(1)
  assert.equal(particles[0].vreme, age)
  session.resume()
  session.update(1)
  post.reagujNaPogodak(30)
  assert.equal(post.destruction.startedAt, ignition, 'repeat damage does not restart the blast')
  post.deploy(600, 30, -1)
  assert.equal(post.destruction.startedAt, null)
  assert.equal(post.destruction.flame.iskre.length, 0)
  assert.equal(post.alive, true)
  assert.equal(post.reagujNaPogodak(30, oldLife), false)
  assert.equal(post.destruction.startedAt, null, 'an old-life hit cannot ignite the reused position')
  post.reagujNaPogodak(30)
  post.sakrij()
  post.update(.1)
  assert.equal(post.destruction.flame.iskre.length, 0, 'hidden positions do not emit particles')
})
