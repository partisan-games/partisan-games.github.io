import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene, AmbientLight } from 'three'
import GameClock from '/core/runtime/GameClock.js'
import ResourceScope from '/core/runtime/ResourceScope.js'

/** Checks that the action has not happened shortly before the delay and has happened shortly after it. */
function assertHappensAfter(play, seconds, happened) {
  play(seconds - .05)
  assert.equal(happened(), false, `not yet before ${seconds} s`)
  play(.1)
  assert.equal(happened(), true, `done after ${seconds} s`)
}

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
  const { lightningStrike } = await import('/core3d/light.js')
  const clock = new GameClock()
  const scope = new ResourceScope({ clock })
  t.after(() => scope.dispose())
  const play = seconds => clock.advance(seconds)
  const light = new AmbientLight(0xffffff, 1)
  let thunder = false
  const sky = new Scene()
  sky.userData.audio = {
    output: { preload() {} },
    emit: () => {
      thunder = true
    },
  }
  t.mock.method(Math, 'random', () => 0) // the closest strike: 100 m, thunder after 0.3 s

  lightningStrike(light, sky, scope)
  assert.notEqual(light.intensity, 1)
  assertHappensAfter(play, .3, () => thunder)
  play(.1)
  assert.notEqual(light.intensity, 1, 'still lit at 0.45 s')
  play(.1)
  assert.equal(light.intensity, 1, 'dark again at 0.55 s')
})
