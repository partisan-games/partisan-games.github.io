import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import { nearestTarget } from '/core/actor/targeting.js'

let Okupator, Granata, mish

before(async() => {
  createPageElements()
  Okupator = (await import('/core/actor/Okupator.js')).default
  Granata = (await import('/core/actor/projektili/Granata.js')).default
  mish = (await import('/core/io/mish.js')).default
})

const target = (x, alive = true) => ({ x, y: 0, alive })

test('aims at the nearest living target', () => {
  const far = target(300), near = target(100), deadNearest = target(10, false)
  assert.equal(nearestTarget({ x: 0, y: 0 }, [far, deadNearest, near]), near)
})

test('finds no target when all are dead', () => {
  assert.equal(nearestTarget({ x: 0, y: 0 }, [target(10, false)]), null)
})

test('a volley hitting in the same frame kills the target only once', () => {
  let deaths = 0
  const cilj = { prikazan: true, alive: true, get dead() {
    return !this.alive
  }, umri() {
    this.alive = false; deaths++
  } }
  const pool = new ProjectilePool({ owner: { predmeti: [] }, create: () => null })
  pool.projectiles = [1, 2, 3].map(() => ({ prikazan: true, proveriPogodak: c => c.umri() }))

  pool.checkHits([cilj])

  assert.equal(deaths, 1)
})

test('a dead occupier gives no more points when clicked', () => {
  const okupator = new Okupator()
  mock.method(mish, 'iznad', () => true)
  let points = 0

  okupator.proveriPogodak(() => points++)
  okupator.proveriPogodak(() => points++)

  assert.equal(points, 1)
  mish.iznad.mock.restore()
})

test('a grenade reset before its explosion finishes does not hurt the target later', () => {
  const clock = new GameClock()
  const granata = new Granata({ clock })
  granata.pokazi()
  let hurt = 0
  const cilj = { sudara: () => true, umri: () => hurt++ }

  granata.proveriPogodak(cilj)
  granata.reset()
  clock.advance(1)

  assert.equal(hurt, 0)
})
