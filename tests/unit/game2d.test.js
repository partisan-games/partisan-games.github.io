import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Player2D, Predmet, Input, platno

before(async() => {
  createPageElements()
  Player2D = (await import('/core/actor/Player2D.js')).default
  Predmet = (await import('/core/actor/Predmet.js')).default
  Input = (await import('/core/io/Input.js')).default
  platno = (await import('/core/io/platno.js')).default
})

/** A 2D player kept on the screen, like the player planes, steered by real keyboard events. */
function createPlayer(t) {
  class BoundedPlayer extends Player2D {
    proveriGranice() {
      this.ogranici()
    }
  }
  const player = new BoundedPlayer(null, { sirina: 40, visina: 20, x: platno.width / 2, y: platno.height / 2 })
  player.input.end()
  player.input = new Input({ useKeyboard: true, useJoystick: false })
  t.after(() => player.end())
  return player
}

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** Runs the 2D game loop order for one object: input, then update. */
function play(player, seconds, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) {
    player.handleInput(1 / fps)
    player.update(1 / fps)
  }
}

test('an arrow key moves the 2D player, and it glides to a stop after release', t => {
  const player = createPlayer(t)
  const startX = player.x

  key('keydown', 'ArrowRight')
  play(player, .5)
  key('keyup', 'ArrowRight')
  // about 280 px per second at full thrust; without dt it would move that far every frame
  assert.ok(player.x > startX + 50 && player.x < startX + 300, `moved from ${startX} to ${player.x}`)

  play(player, 2)
  const stoppedAt = player.x
  play(player, .5)
  assert.ok(Math.abs(player.x - stoppedAt) < 1, 'stopped')
})

test('a 2D player attacks on the key its game picks, and on Enter when the game picks none', t => {
  const attacksOn = (options, code) => {
    const player = new Player2D(null, options)
    t.after(() => player.end())
    key('keydown', code)
    const { attack } = player.input
    key('keyup', code)
    return Boolean(attack)
  }

  assert.equal(attacksOn({ attackKey: 'Space' }, 'Space'), true)
  assert.equal(attacksOn({ attackKey: 'Space' }, 'Enter'), false)
  assert.equal(attacksOn({}, 'Enter'), true)
})

test('the 2D player covers about the same distance at 30 and at 60 frames per second', t => {
  const distance = fps => {
    const player = createPlayer(t)
    const startY = player.y
    key('keydown', 'ArrowDown')
    play(player, 1, fps)
    key('keyup', 'ArrowDown')
    return player.y - startY
  }
  const at60 = distance(60), at30 = distance(30)

  assert.ok(Math.abs(at60 - at30) / at60 < .15, `60 fps: ${at60}, 30 fps: ${at30}`)
})

test('the 2D player stays on the screen when it keeps flying into the edge', t => {
  const player = createPlayer(t)

  key('keydown', 'ArrowRight')
  play(player, 10)
  key('keyup', 'ArrowRight')

  assert.ok(player.x <= platno.width - player.sirina / 4, `x ${player.x} of ${platno.width}`)
})

test('a moving shot hits its target once and scores one point', () => {
  const target = new Predmet(null, { sirina: 50, visina: 50, x: 500, y: 100 })
  const shot = new Predmet(null, { sirina: 6, visina: 6, x: 100, y: 100, brzina: 600 })
  let score = 0

  for (let i = 0; i < 120; i++) {
    shot.update(1 / 60)
    if (target.alive && shot.sudara(target)) {
      target.umri()
      score++
    }
  }

  assert.equal(target.dead, true)
  assert.equal(score, 1)
})

test('a tilted player plane levels out exactly, also when frame lengths vary', async t => {
  const { default: AvionIgrac } = await import('/core/actor/derived/AvionIgrac.js')
  const plane = new AvionIgrac(10_000)
  t.after(() => plane.end())
  plane.ugao = .05

  for (let i = 0; i < 120; i++) plane.update(i % 2 ? 1 / 50 : 1 / 70)
  assert.equal(plane.ugao, 0)
  plane.update(1 / 60)
  assert.equal(plane.ugao, 0)
})

