import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Input

before(async() => {
  createPageElements()
  Input = (await import('/core/io/Input.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** Asserts that a value measured after the same play time is about the same at 30 and at 60 frames per second. */
function assertSameAt30And60(measure, what) {
  const at60 = measure(60), at30 = measure(30)
  assert.ok(Math.abs(at60 - at30) <= Math.abs(at60) * .15 + .5, `${what}: ${at60} at 60 fps, ${at30} at 30 fps`)
}

/** The franjo-kluz scene, with the player steered by real keyboard events. */
async function createFranjoKluz(t) {
  const { default: FranjoKluz } = await import('/scenes/franjo-kluz/Main.js')
  const scene = new FranjoKluz()
  scene.init()
  scene.player.input.end()
  scene.player.input = new Input({ useKeyboard: true, useJoystick: false })
  t.after(() => {
    scene.clear = () => {} // happy-dom has no 2D canvas to draw the sky on
    scene.end()
  })
  return scene
}

function play(scene, seconds, fps) {
  for (let i = 0; i < seconds * fps; i++) {
    scene.handleInput(1 / fps)
    scene.update(1 / fps, i / fps)
  }
}

/** Plays with the keys held and returns what measure reads at the end. */
const holding = (t, codes, seconds, measure) => async fps => {
  const scene = await createFranjoKluz(t)
  codes.forEach(code => key('keydown', code))
  play(scene, seconds, fps)
  codes.forEach(code => key('keyup', code))
  return measure(scene)
}

test('in franjo-kluz the scenery speeds up and rises as fast at 30 as at 60 frames per second', async t => {
  const measureAt = async(codes, seconds, measure) => {
    const run = holding(t, codes, seconds, measure)
    return { 60: await run(60), 30: await run(30) }
  }

  const speed = await measureAt(['ArrowUp', 'ArrowRight'], 1.5, scene => scene.brzinaScene)
  assertSameAt30And60(fps => speed[fps], 'scenery speed')

  const height = await measureAt(['ArrowUp'], 4, scene => scene.dignutostScene)
  assert.ok(height[60] > 0, 'the scenery rose')
  assertSameAt30And60(fps => height[fps], 'scenery height')
})

test('in franjo-kluz the scenery slows down on the ground as fast at 30 as at 60 frames per second', async t => {
  const results = {}
  for (const fps of [60, 30]) {
    const scene = await createFranjoKluz(t)
    // landed: images do not load in unit tests, so the plane has no height of its own
    scene.player.visina = 20
    scene.player.y = scene.player.nivoTla - 10
    scene.pocniParalax()
    play(scene, .25, fps)
    results[fps] = scene.zbunovi[0].dx
  }
  assert.ok(results[60] < 0 && results[60] > -312, `the bushes slow down but still move: ${results[60]}`)
  assertSameAt30And60(fps => results[fps], 'bush speed')
})

test('a tenkici tank rolls as far at 30 as at 60 frames per second after a push', async() => {
  const { default: TenkLevo } = await import('/scenes/tenkici/TenkLevo.js')
  assertSameAt30And60(fps => {
    const tank = new TenkLevo({ x: 100, xLimit: 5000 })
    tank.dodajSilu(100, 0)
    for (let i = 0; i < fps; i++) tank.update(1 / fps)
    return tank.x - 100
  }, 'distance')
})
