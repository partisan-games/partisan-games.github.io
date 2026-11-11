import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let praviPucanje, Okupator, Granata, mish

before(async() => {
  createPageElements()
  ;({ praviPucanje } = await import('/core/actor/prosirenja/pucanje.js'))
  Okupator = (await import('/core/actor/Okupator.js')).default
  Granata = (await import('/core/actor/projektili/Granata.js')).default
  mish = (await import('/core/io/mish.js')).default
})

const target = (x, ziv = true) => ({ polozaj: { x, y: 0, z: 0 }, ziv, get mrtav() {
  return !this.ziv
} })

const shooter = ciljevi => Object.assign(
  { polozaj: { x: 0, y: 0, z: 0 }, razmakDo(c) {
    return Math.abs(c.polozaj.x)
  } },
  praviPucanje(),
  { ciljevi },
)

test('aims at the nearest living target', () => {
  const far = target(300), near = target(100), deadNearest = target(10, false)
  assert.equal(shooter([far, deadNearest, near]).traziNajblizuMetu(), near)
})

test('finds no target when all are dead', () => {
  assert.equal(shooter([target(10, false)]).traziNajblizuMetu(), undefined)
})

test('a volley hitting in the same frame kills the target only once', () => {
  let deaths = 0
  const cilj = { prikazan: true, ziv: true, get mrtav() {
    return !this.ziv
  }, umri() {
    this.ziv = false; deaths++
  } }
  const s = shooter([cilj])
  s.meci = [1, 2, 3].map(() => ({ prikazan: true, proveriPogodak: c => c.umri() }))

  s.proveriPogodak(cilj)

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

test('a grenade reset before its explosion finishes does not hurt the target later', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const granata = new Granata()
  granata.pokazi()
  let hurt = 0
  const cilj = { sudara: () => true, umri: () => hurt++ }

  granata.proveriPogodak(cilj)
  granata.reset()
  t.mock.timers.tick(1000)

  assert.equal(hurt, 0)
})
