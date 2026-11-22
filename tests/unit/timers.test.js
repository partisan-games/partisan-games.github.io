import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Scene, AmbientLight } from 'three'
import GameClock from '/core/runtime/GameClock.js'
import ResourceScope from '/core/runtime/ResourceScope.js'

/** Checks that the action has not happened shortly before the delay and has happened shortly after it. */
function assertHappensAfter(play, seconds, happened) {
  play(seconds - .05)
  assert.equal(happened(), false, `not yet before ${seconds} s`)
  play(.1)
  assert.equal(happened(), true, `done after ${seconds} s`)
}

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
