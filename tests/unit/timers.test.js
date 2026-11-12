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

test('a shot down enemy plane in vis falls for 2 s and then is gone', async t => {
  const { scene, play } = startScene(t)
  const { default: Enemy } = await import('/scenes/vis/Enemy.js')
  const plane = new Enemy({ session: scene.session, path: 'boss' }) // stays on the screen
  scene.add(plane)

  plane.umri()
  assertHappensAfter(play, 2, () => plane.gone)
})

test('the player plane in vis flies again 2.5 s after it is shot down', async t => {
  const { scene, play } = startScene(t)
  const { Avionce } = await import('/scenes/vis/Avionce.js')
  const plane = new Avionce({ session: scene.session })
  scene.add(plane)

  plane.umri()
  assertHappensAfter(play, 2.5, () => plane.alive)
  plane.end()
})

test('a grenade hurts its target 0.15 s after it hits', async t => {
  const { scene, play } = startScene(t)
  const { default: Granata } = await import('/core/actor/projektili/Granata.js')
  const grenade = new Granata({ clock: scene.session.clock })
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
  const grenade = new Granata({ clock: scene.session.clock })
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
  const { default: AI } = await import('/core3d/actor/AI.js')
  const actor = new AI({ mesh: new Mesh(new BoxGeometry(1, 2, 1)) })
  new Scene().add(actor.mesh)
  return actor
}

/** Plays the actor alone, frame by frame: its delayed actions wait on its own game time. */
const playActor = actor => seconds => {
  for (let i = 0; i < Math.round(seconds * 60); i++) actor.update(1 / 60)
}

test('an attack strikes halfway through its animation', async() => {
  const actor = await createActor()
  const play = playActor(actor)
  let struck = false
  actor.intersect = () => {
    struck = true
    return []
  }

  Object.defineProperty(actor, 'action', { value: { getClip: () => ({ duration: .8 }) } }) // the attack animation that plays
  actor.enterAttack('enemy')
  assertHappensAfter(play, .4, () => struck)
})

test('a fire attack starts its flame after the delay it asks for', async() => {
  const actor = await createActor()
  const play = playActor(actor)
  const { Flame } = await import('/core3d/Particles.js')
  actor.flame = new Flame()
  let burning = false

  actor.startFlame(1, () => {
    burning = true
  })
  assertHappensAfter(play, 1, () => burning)
})

test('lightning lights the sky for half a second and the thunder follows by distance', async t => {
  const { scene, play } = startScene(t)
  const { lightningStrike } = await import('/core3d/light.js')
  const light = new AmbientLight(0xffffff, 1)
  let thunder = false
  globalThis.Audio = class {
    play() {
      thunder = true
    }
  }
  t.mock.method(Math, 'random', () => 0) // the closest strike: 100 m, thunder after 0.3 s

  lightningStrike(light, new Scene(), scene.session.presentation)
  assert.notEqual(light.intensity, 1)
  assertHappensAfter(play, .3, () => thunder)
  play(.1)
  assert.notEqual(light.intensity, 1, 'still lit at 0.45 s')
  play(.1)
  assert.equal(light.intensity, 1, 'dark again at 0.55 s')
})
