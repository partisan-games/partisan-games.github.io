import { test } from 'node:test'
import assert from 'node:assert/strict'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import prepareCombatAssets from '/scenes/2d-tank/prepareCombatAssets.js'

test('prepared projectiles stay inactive, are reused by fire, and preparation leaves flights untouched', () => {
  const owner = { predmeti: [] }
  let created = 0
  const pool = new ProjectilePool({ owner, create: () => {
    created++
    return {
      vidljiv: true,
      reset() { this.vidljiv = false },
      pali(position, angle, speed) { this.vidljiv = true; this.flight = { position, angle, speed } },
    }
  } })
  assert.equal(created, 0, 'unprepared pools keep their existing lazy behavior')
  pool.prepare(2)
  assert.equal(created, 2)
  assert.deepEqual(owner.predmeti, pool.projectiles)
  assert.ok(pool.projectiles.every(projectile => !projectile.vidljiv))
  const position = { x: 12, y: 34 }
  pool.fire(position, .4, 500)
  const [shot] = pool.projectiles
  pool.prepare(2)
  assert.equal(created, 2)
  assert.equal(shot.vidljiv, true)
  assert.deepEqual(shot.flight, { position, angle: .4, speed: 500 })
})

test('combat preparation waits for the explosion child to load and decode before becoming ready', async() => {
  let finishLoading, finishDecoding, decoding = false, ready = false
  const explosion = {
    slikaUcitana: new Promise(resolve => { finishLoading = resolve }),
    slika: { decode: () => {
      decoding = true
      return new Promise(resolve => { finishDecoding = resolve })
    } },
  }
  const owner = { predmeti: [] }
  const pool = new ProjectilePool({ owner, create: () => ({
    predmeti: [explosion],
    slikaUcitana: Promise.resolve(),
    slika: { decode: async() => {} },
    reset() { this.vidljiv = false },
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
  assert.equal(pool.projectiles[0].vidljiv, false)
})

test('a decoding failure rejects preparation instead of reporting assets ready', async() => {
  const pool = new ProjectilePool({ owner: { predmeti: [] }, create: () => ({
    slikaUcitana: Promise.resolve(),
    slika: { decode: async() => { throw new Error('decode failed') } },
    reset() {},
  }) })
  await assert.rejects(prepareCombatAssets([pool]), /decode failed/)
})
