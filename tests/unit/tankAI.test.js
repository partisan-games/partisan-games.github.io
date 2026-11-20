import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let TenkLevo, TenkDesno, TankAI, tankAI, GameClock

before(async() => {
  createPageElements()
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  TenkDesno = (await import('/scenes/tenkici/TenkDesno.js')).default
  ;({ default: TankAI, tankAI } = await import('/core/gameplay/controllers/TankAI.js'))
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

const shownGrenades = tank => tank.granate.projectiles.filter(g => g.visible)

function selfDriven() {
  const clock = new GameClock()
  const tank = new TenkDesno({ clock })
  const ai = new TankAI(tank, { clock })
  tank.controller = ai
  return { clock, tank, ai }
}

test('the AI tank fires first after its wait of game time, however long the game stood still before', () => {
  const { clock, tank, ai } = selfDriven()
  tank.targets.push(new TenkLevo({ x: 100, xLimit: 500, clock }))

  ai.update()
  assert.equal(shownGrenades(tank).length, 0)
  clock.advance(tankAI.fireWait)
  ai.update()
  assert.equal(shownGrenades(tank).length, 1)
})

test('the AI raises the barrel at the nearest living target and holds fire with none', () => {
  const { clock, tank, ai } = selfDriven()
  tank.x = 900
  const near = new TenkLevo({ x: 600, xLimit: 5000, clock })
  const far = new TenkLevo({ x: 100, xLimit: 5000, clock })
  const aimed = []
  tank.nisani = target => aimed.push(target)
  tank.targets.push(far, near)
  clock.advance(tankAI.fireWait)
  ai.update()
  assert.deepEqual(aimed, [near])

  near.alive = far.alive = false
  clock.advance(tankAI.fireWait)
  ai.update()
  assert.equal(aimed.length, 1)
  assert.equal(shownGrenades(tank).length, 1, 'only the shot at the living target')
})

test('the AI drives ahead from the back of its ground and back from past its front, and a dead tank does nothing', t => {
  t.after(() => mock.restoreAll())
  const { clock, tank, ai } = selfDriven()
  const pushAt = (x, random) => {
    mock.method(Math, 'random', () => random)
    tank.x = x
    tank.dx = 0
    clock.advance(tankAI.turn)
    ai.update()
    return Math.sign(tank.dx)
  }
  // the right tank faces left, so ahead is left
  assert.equal(pushAt(tank.maxX - 1, .01), -1, 'in its back zone it drives ahead, even after a turn back')
  assert.equal(pushAt(tank.minX - 1, 1), 1, 'past its front edge it drives back, even after a turn ahead')
  const middle = (tank.minX + tank.maxX) / 2
  assert.equal(pushAt(middle, 1), -1, 'between them a turn ahead drives ahead')
  assert.equal(pushAt(middle, .01), 1, 'and a turn back drives back')

  tank.alive = false
  assert.equal(pushAt(tank.maxX - 1, 1), 0)
})
