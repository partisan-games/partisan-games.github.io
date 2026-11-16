import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import { nearestTarget } from '/core/actor/targeting.js'

let Occupier, Shell, mouse

before(async() => {
  createPageElements()
  Occupier = (await import('/core/actor/Occupier.js')).default
  Shell = (await import('/core/actor/projectiles/Shell.js')).default
  mouse = (await import('/core/io/mouse.js')).default
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
  const cilj = { shown: true, alive: true, get dead() {
    return !this.alive
  }, die() {
    this.alive = false; deaths++
  } }
  const pool = new ProjectilePool({ owner: { children: [] }, create: () => null })
  pool.projectiles = [1, 2, 3].map(() => ({ shown: true, checkHit: c => c.die() }))

  pool.checkHits([cilj])

  assert.equal(deaths, 1)
})

test('a dead occupier gives no more points when clicked', () => {
  const okupator = new Occupier()
  mock.method(mouse, 'isOver', () => true)
  let points = 0

  okupator.checkHit(() => points++)
  okupator.checkHit(() => points++)

  assert.equal(points, 1)
  mouse.isOver.mock.restore()
})

test('a grenade reset before its explosion finishes does not hurt the target later', () => {
  const clock = new GameClock()
  const granata = new Shell({ clock })
  granata.show()
  let hurt = 0
  const cilj = { collidesWith: () => true, die: () => hurt++ }

  granata.checkHit(cilj)
  granata.reset()
  clock.advance(1)

  assert.equal(hurt, 0)
})
