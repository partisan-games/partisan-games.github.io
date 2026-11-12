import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let TenkLevo, TenkDesno, GameClock

before(async() => {
  createPageElements()
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  TenkDesno = (await import('/scenes/tenkici/TenkDesno.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** Presses and releases Space for the left tank, which fires on the release. */
function pressSpace(tank) {
  key('keydown', 'Space')
  tank.handleInput(1 / 60)
  const beforeRelease = tank.granate.projectiles.filter(g => g.vidljiv).length
  key('keyup', 'Space')
  tank.handleInput(1 / 60)
  return beforeRelease
}

const shownGrenades = tank => tank.granate.projectiles.filter(g => g.vidljiv)

test('the left tank fires on the release of Space, its grenade leaves the barrel tip along the barrel, and the tank recoils', () => {
  const tank = new TenkLevo({ x: 100, xLimit: 500, clock: new GameClock() })
  const tip = tank.vrhCevi
  const angle = tank.cev.ugao

  assert.equal(pressSpace(tank), 0, 'nothing is fired while Space is held')
  const [grenade] = shownGrenades(tank)
  assert.ok(grenade)
  assert.deepEqual({ x: grenade.x, y: grenade.y }, tip)
  assert.equal(grenade.ugao, angle)
  assert.ok(Math.abs(Math.hypot(grenade.dx, grenade.dy) - (window.innerWidth > 1920 ? 520 : 500)) < 1e-9)
  assert.ok(tank.dx < 0, 'the recoil pushes the tank back')
})

test('during the reload a release fires nothing and gives no recoil, and the reload waits on game time', () => {
  const clock = new GameClock()
  const tank = new TenkLevo({ x: 100, xLimit: 500, clock })
  pressSpace(tank)
  tank.dx = tank.dy = 0

  clock.advance(.5)
  pressSpace(tank)
  assert.equal(shownGrenades(tank).length, 1)
  assert.equal(tank.dx, 0)

  clock.advance(.5)
  pressSpace(tank)
  assert.equal(shownGrenades(tank).length, 2)
})

test('the AI tank fires first after its wait of game time, however long the game stood still before', () => {
  const clock = new GameClock()
  const ai = new TenkDesno({ ai: true, clock })
  const target = new TenkLevo({ x: 100, xLimit: 500, clock })
  ai.ciljevi.push(target)

  ai.samohod()
  assert.equal(shownGrenades(ai).length, 0)
  clock.advance(1.5)
  ai.samohod()
  assert.equal(shownGrenades(ai).length, 1)
})

test('a grenade hit takes the target health and pushes it back, and leaves the shooter whole', async() => {
  const { default: Granata } = await import('/core/actor/projektili/Granata.js')
  const clock = new GameClock()
  const shooter = new TenkLevo({ x: 100, xLimit: 500, clock })
  const target = new TenkDesno({ ai: false, clock })
  const grenade = new Granata({ clock })
  let hits = 0
  const { settle } = await import('./helpers/scenes.js')
  await settle() // a flammable object gets its flame from a module it loads on its own

  grenade.povredi(target, () => hits++)
  assert.equal(target.energija, 100 - grenade.steta)
  assert.ok(target.dx > 0, 'the right tank is pushed back to the right')
  assert.equal(shooter.energija, 100)
  assert.equal(hits, 1)
  assert.equal(target.zapaljen, false)

  target.reagujNaPogodak(target.energija - 20)
  assert.equal(target.zapaljen, true)
  target.reagujNaPogodak(50)
  assert.equal(target.energija, 0)
  assert.ok(target.dead)
  target.alive = true // the old setter brings a tank back with full energy
  assert.equal(target.energija, 100)
})

test('when both tanks are destroyed at once, the victory stands', async() => {
  const { installFakeFrames } = await import('./helpers/frames.js')
  installFakeFrames()
  const { default: Tenkici } = await import('/scenes/tenkici/Main.js')
  const scene = new Tenkici()
  scene.init()
  scene.start()
  scene.tenk.alive = scene.tenk2.alive = false

  scene.update(0)
  assert.match(document.getElementById('modal').textContent, /German tank destroyed/)
  assert.doesNotMatch(document.getElementById('modal').textContent, /Game over/)
  scene.clear = () => {} // happy-dom has no 2D canvas to draw the background on
  scene.end()
})

test('a tank driven with its key held goes as far at 30 as at 60 frames per second', () => {
  const distance = fps => {
    const tank = new TenkLevo({ x: 100, xLimit: 5000, clock: new GameClock() })
    key('keydown', 'KeyD')
    for (let i = 0; i < fps; i++) {
      tank.handleInput(1 / fps)
      tank.update(1 / fps)
    }
    key('keyup', 'KeyD')
    tank.end?.()
    return tank.x - 100
  }
  const at30 = distance(30), at60 = distance(60)
  // at 30 frames per second, where the tanks were tuned, push and friction act once a frame, as in the original code
  assert.ok(Math.abs(at30 - 178.2) < 1, `as far as the original code went at 30: ${at30}`)
  // was twice as far at 60; what is left comes from friction applied after each move, not from the push
  assert.ok(Math.abs(at30 - at60) / at60 < .1, `${at30} at 30, ${at60} at 60`)
})

test('a tank grenade that hits does its damage after the blast, on the game clock only', () => {
  const clock = new GameClock()
  const shooter = new TenkLevo({ x: 100, xLimit: 500, clock })
  const target = new TenkDesno({ ai: false, clock })
  pressSpace(shooter)
  const [grenade] = shownGrenades(shooter)
  target.sudara = () => true

  grenade.proveriPogodak(target)
  clock.advance(.1)
  assert.equal(target.energija, 100, 'not during the blast, nor while the game stands still')
  clock.advance(.05)
  assert.equal(target.energija, 100 - grenade.steta)
})
