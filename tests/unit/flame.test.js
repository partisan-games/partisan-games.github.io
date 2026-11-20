import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Flame, flame

before(async() => {
  createPageElements()
  ;({ default: Flame, flame } = await import('/core/actor/Flame.js'))
})

test('a flame sends up as many sparks a second as it is set to, from its point, upwards and to both sides', t => {
  const randoms = [0, 0, 1, 1] // dx, then dy, of each spark
  let i = 0
  t.mock.method(Math, 'random', () => randoms[i++ % 4])
  const fire = new Flame(400, 300)
  fire.spawn(.1)
  assert.equal(fire.sparks.length, flame.perSecond * .1)
  assert.ok(fire.sparks.every(spark => spark.x === 400 && spark.y === 300))
  assert.deepEqual(new Set(fire.sparks.map(spark => spark.dx)), new Set([-flame.speed / 2, flame.speed / 2]))
  assert.ok(fire.sparks.every(spark => spark.dy <= 0))
})

test('a spark lives as long as the flame says, and a flame that reuses its sparks keeps their objects', () => {
  for (const reuseParticles of [false, true]) {
    const fire = new Flame(0, 0, { reuseParticles })
    fire.update(.1)
    const first = [...fire.sparks]
    for (let time = .1; time < flame.life - .1; time += .1) fire.update(.1)
    assert.ok(first.every(spark => fire.sparks.includes(spark)), 'young sparks stay')
    fire.update(.2)
    assert.ok(first.every(spark => !fire.sparks.includes(spark)), 'old sparks are gone')
    if (reuseParticles) {
      const seen = new Set([...first, ...fire.sparks])
      fire.clear()
      fire.update(.1)
      assert.ok(fire.sparks.every(spark => seen.has(spark)), 'new sparks reuse old ones')
    }
  }
})

test('a cleared flame shows no sparks until it burns again', () => {
  const fire = new Flame()
  fire.update(.1)
  fire.clear()
  assert.equal(fire.sparks.length, 0)
})
