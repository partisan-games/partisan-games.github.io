import { test } from 'node:test'
import assert from 'node:assert/strict'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import prepareCombatAssets from '/scenes/to-trieste/prepareCombatAssets.js'

test('prepared projectiles stay inactive, are reused by fire, and preparation leaves flights untouched', () => {
  const owner = { children: [] }
  let created = 0
  const pool = new ProjectilePool({ owner, create: () => {
    created++
    return {
      visible: true,
      reset() { this.visible = false },
      launch(position, angle, speed) { this.visible = true; this.flight = { position, angle, speed } },
    }
  } })
  assert.equal(created, 0, 'unprepared pools keep their existing lazy behavior')
  pool.prepare(2)
  assert.equal(created, 2)
  assert.deepEqual(owner.children, pool.projectiles)
  assert.ok(pool.projectiles.every(projectile => !projectile.visible))
  const position = { x: 12, y: 34 }
  pool.fire(position, .4, 500)
  const [shot] = pool.projectiles
  pool.prepare(2)
  assert.equal(created, 2)
  assert.equal(shot.visible, true)
  assert.deepEqual(shot.flight, { position, angle: .4, speed: 500 })
})

test('combat preparation waits for the explosion child to load and decode before becoming ready', async() => {
  let finishLoading, finishDecoding, decoding = false, ready = false
  const explosion = {
    imageLoaded: new Promise(resolve => { finishLoading = resolve }),
    image: { decode: () => {
      decoding = true
      return new Promise(resolve => { finishDecoding = resolve })
    } },
  }
  const owner = { children: [] }
  const pool = new ProjectilePool({ owner, create: () => ({
    children: [explosion],
    imageLoaded: Promise.resolve(),
    image: { decode: async() => {} },
    reset() { this.visible = false },
  }) })
  const preparation = prepareCombatAssets([pool]).then(() => { ready = true })
  assert.equal(pool.projectiles.length, 1)
  await Promise.resolve()
  assert.equal(decoding, false)
  assert.equal(ready, false)
  finishLoading()
  await Promise.resolve()
  assert.equal(decoding, true)
  assert.equal(ready, false)
  finishDecoding()
  await preparation
  assert.equal(ready, true)
  assert.equal(pool.projectiles[0].visible, false)
})

test('a decoding failure rejects preparation instead of reporting assets ready', async() => {
  const pool = new ProjectilePool({ owner: { children: [] }, create: () => ({
    imageLoaded: Promise.resolve(),
    image: { decode: async() => { throw new Error('decode failed') } },
    reset() {},
  }) })
  await assert.rejects(prepareCombatAssets([pool]), /decode failed/)
})

test('shot feedback is called after launch for both new and reused projectiles, never during preparation', () => {
  const events = []
  const pool = new ProjectilePool({ owner: { children: [] }, create: () => ({
    visible: false,
    reset() { this.visible = false },
    launch() { this.visible = true },
  }), onFire: event => {
    assert.equal(event.projectile.visible, true)
    events.push(event)
  } })
  pool.prepare()
  assert.equal(events.length, 0)
  const position = { x: 10, y: 20 }
  pool.fire(position, .3, 500)
  pool.projectiles[0].reset()
  pool.fire(position, .7, 500)
  assert.equal(events.length, 2)
  assert.equal(events[0].projectile, events[1].projectile)
  assert.equal(events[0].position, position)
  assert.equal(events[1].angle, .7)
})
