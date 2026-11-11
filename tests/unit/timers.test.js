import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene, AmbientLight } from 'three'
import { createPageElements } from './helpers/dom.js'
import { installFakeFrames } from './helpers/frames.js'

let Scena

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
})

const frame = 1000 / 60

/**
 * A started scene whose game loop runs frame by frame while the browser clock moves along,
 * so a delayed action fires whether it waits on the browser clock or on game time.
 */
function startScene(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const frames = installFakeFrames()
  const scene = new Scena({ canvas: document.createElement('canvas') })
  scene.start()
  frames.step(frame)
  t.after(() => scene.end())
  const play = seconds => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      frames.step(frame)
      t.mock.timers.tick(frame)
    }
  }
  return { scene, play }
}

/** Checks that the action has not happened shortly before the delay and has happened shortly after it. */
function assertHappensAfter(play, seconds, happened) {
  play(seconds - .05)
  assert.equal(happened(), false, `not yet before ${seconds} s`)
  play(.1)
  assert.equal(happened(), true, `done after ${seconds} s`)
}

test('a shot down enemy plane in vis comes back after 2 s', async t => {
  const { scene, play } = startScene(t)
  const { default: Neprijatelj } = await import('/scenes/vis/Neprijatelj.js')
  const plane = new Neprijatelj('armies/nemci/avioni/avion-odozgo-01.png', { potisak: 150 })
  scene.add(plane)

  plane.umri()
  assertHappensAfter(play, 2, () => plane.alive)
})

test('the player plane in vis flies again 2.5 s after it is shot down', async t => {
  const { scene, play } = startScene(t)
  const { Avionce } = await import('/core/actor/derived/Avionce.js')
  const plane = new Avionce()
  scene.add(plane)

  plane.umri()
  assertHappensAfter(play, 2.5, () => plane.alive)
  plane.end()
})

test('a grenade hurts its target 0.15 s after it hits', async t => {
  const { scene, play } = startScene(t)
  const { default: Granata } = await import('/core/actor/projektili/Granata.js')
  const grenade = new Granata()
  let hurt = false
  grenade.povredi = () => {
    hurt = true
  }
  scene.add(grenade)

  grenade.proveriPogodak({ sudara: () => true })
  assertHappensAfter(play, .15, () => hurt)
})

test('a grenade that is reset before it hurts its target never hurts it', async t => {
  const { scene, play } = startScene(t)
  const { default: Granata } = await import('/core/actor/projektili/Granata.js')
  const grenade = new Granata()
  let hurt = false
  grenade.povredi = () => {
    hurt = true
  }
  scene.add(grenade)

  grenade.proveriPogodak({ sudara: () => true })
  grenade.reset()
  play(1)
  assert.equal(hurt, false)
})

const createActor = async() => {
  const { default: Actor } = await import('/core3d/actor/Actor.js')
  const actor = new Actor({ mesh: new Mesh(new BoxGeometry(1, 2, 1)) })
  new Scene().add(actor.mesh)
  return actor
}

test('an attack strikes halfway through its animation', async t => {
  const { play } = startScene(t)
  const actor = await createActor()
  let struck = false
  actor.intersect = () => {
    struck = true
    return []
  }

  Object.defineProperty(actor, 'action', { value: { getClip: () => ({ duration: .8 }) } }) // the attack animation that plays
  actor.enterAttack('enemy')
  assertHappensAfter(play, .4, () => struck)
})

test('a fire attack starts its flame after the delay it asks for', async t => {
  const { play } = startScene(t)
  const actor = await createActor()
  const { Flame } = await import('/core3d/Particles.js')
  actor.flame = new Flame()
  let burning = false

  actor.startFlame(1, () => {
    burning = true
  })
  assertHappensAfter(play, 1, () => burning)
})

test('lightning lights the sky for half a second and the thunder follows by distance', async t => {
  const { play } = startScene(t)
  const { lightningStrike } = await import('/core3d/light.js')
  const light = new AmbientLight(0xffffff, 1)
  let thunder = false
  globalThis.Audio = class {
    play() {
      thunder = true
    }
  }
  t.mock.method(Math, 'random', () => 0) // the closest strike: 100 m, thunder after 0.3 s

  lightningStrike(light, new Scene())
  assert.notEqual(light.intensity, 1)
  assertHappensAfter(play, .3, () => thunder)
  play(.1)
  assert.notEqual(light.intensity, 1, 'still lit at 0.45 s')
  play(.1)
  assert.equal(light.intensity, 1, 'dark again at 0.55 s')
})

test('a delayed action waits while the game is paused', async t => {
  const { scene, play } = startScene(t)
  const { after } = await import('/core/timers.js')
  let done = false
  after(1, () => {
    done = true
  })

  play(.5)
  scene.pause()
  play(5)
  assert.equal(done, false, 'not during the pause')

  scene.unpause()
  assertHappensAfter(play, .5, () => done)
})

test('a delayed action of a game that has ended never fires in the next game', async t => {
  const { scene, play } = startScene(t)
  const { after } = await import('/core/timers.js')
  let done = false
  after(1, () => {
    done = true
  })

  scene.end()
  const next = new Scena({ canvas: document.createElement('canvas') })
  next.start()
  play(3)
  next.end()

  assert.equal(done, false)
})

test('a cancelled action never fires, and one action can cancel another due at the same time', async t => {
  const { play } = startScene(t)
  const { after, cancel } = await import('/core/timers.js')
  const fired = []
  let second = null
  after(1, () => cancel(second))
  second = after(1, () => fired.push('second'))
  after(.5, () => fired.push('first'))
  const third = after(2, () => fired.push('third'))
  cancel(third)

  play(3)
  assert.deepEqual(fired, ['first'])
})
