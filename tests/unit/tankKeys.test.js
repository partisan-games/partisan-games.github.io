import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let TenkLevo, TenkDesno, TankKeys, GameClock, keys

before(async() => {
  createPageElements()
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  TenkDesno = (await import('/scenes/tenkici/TenkDesno.js')).default
  TankKeys = (await import('/core/io/controllers/TankKeys.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  keys = await import('/core/io/keys.js')
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

const shownGrenades = tank => tank.granate.projectiles.filter(g => g.visible)

/** A left tank that the left player's keys drive. */
function driven({ x = 100, xLimit = 500, clock = new GameClock() } = {}) {
  const tank = new TenkLevo({ x, xLimit, clock })
  tank.controller = new TankKeys(tank, keys.leftPlayerKeys)
  return tank
}

/** Presses and releases Space for the left tank, which fires on the release. */
function pressSpace(tank) {
  key('keydown', 'Space')
  tank.handleInput(1 / 60)
  const beforeRelease = shownGrenades(tank).length
  key('keyup', 'Space')
  tank.handleInput(1 / 60)
  return beforeRelease
}

test('the left tank fires on the release of Space, its grenade leaves the barrel tip along the barrel, and the tank recoils', () => {
  const tank = driven()
  const tip = tank.vrhCevi
  const { angle } = tank.cev

  assert.equal(pressSpace(tank), 0, 'nothing is fired while Space is held')
  const [grenade] = shownGrenades(tank)
  assert.ok(grenade)
  assert.deepEqual({ x: grenade.x, y: grenade.y }, tip)
  assert.equal(grenade.angle, angle)
  assert.ok(Math.abs(Math.hypot(grenade.dx, grenade.dy) - (window.innerWidth > 1920 ? 520 : 500)) < 1e-9)
  assert.ok(tank.dx < 0, 'the recoil pushes the tank back')
})

test('during the reload a release fires nothing and gives no recoil, and the reload waits on game time', () => {
  const clock = new GameClock()
  const tank = driven({ clock })
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

test('a tank driven with its key held goes as far at 30 as at 60 frames per second', () => {
  const distance = fps => {
    const tank = driven({ xLimit: 5000 })
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

test('each tank drives back slower than ahead, and not past the edges of its ground', () => {
  const push = (tank, code) => {
    tank.dx = 0
    key('keydown', code)
    tank.handleInput(1 / 30)
    key('keyup', code)
    return tank.dx
  }
  const left = driven({ x: 100 })
  assert.ok(Math.abs(push(left, 'KeyA') / push(left, 'KeyD') + .6) < 1e-9, 'the left tank faces right')
  left.x = 0
  assert.equal(push(left, 'KeyA'), 0, 'not past its left edge')
  left.x = 500
  assert.equal(push(left, 'KeyD'), 0, 'not past its xLimit')

  const right = new TenkDesno({ x: 0, clock: new GameClock() })
  right.controller = new TankKeys(right, keys.rightPlayerKeys)
  right.x = (right.minX + right.maxX) / 2
  assert.ok(Math.abs(push(right, 'ArrowRight') / push(right, 'ArrowLeft') + .6) < 1e-9, 'the right tank faces left')
  right.x = right.minX
  assert.equal(push(right, 'ArrowLeft'), 0, 'not past the middle of the screen')
})
