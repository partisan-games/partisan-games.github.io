import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene } from 'three'
import AI from '/core3d/actor/AI.js'

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

/** Like the golem, the follower's forward ray hits the target before it gets within followDistance. */
function createFollower(options = {}) {
  const scene = new Scene()
  const target = createBody(2)
  target.name = 'player'
  const ai = new AI({ mesh: createBody(2.5), pos: [6, 0, 0], baseState: 'follow', target, ...options })
  scene.add(target, ai.mesh)
  const play = seconds => {
    let switches = 0
    for (let i = 0; i < seconds * 60; i++) {
      const before = ai.state
      scene.updateMatrixWorld()
      ai.update(1 / 60)
      if (ai.state !== before) switches++
    }
    return switches
  }
  return { ai, target, play }
}

test('a follower blocked by its target stops instead of stepping around it', () => {
  const { ai, play } = createFollower()
  assert.ok(ai.depth * 2 + .5 > ai.followDistance, 'the blocking ray must reach farther than followDistance')

  play(5)
  assert.equal(ai.state, 'idle')
  const { x, z } = ai.position
  assert.equal(play(5), 0)
  assert.deepEqual([ai.position.x, ai.position.z], [x, z])
})

test('a stopped follower walks again once the target moves away', () => {
  const { ai, target, play } = createFollower()
  play(5)
  target.position.x -= 3
  play(.5)
  assert.equal(ai.state, 'follow')
})

test('the composed movement of the follow pilot follows, stops and walks again exactly like the old one', () => {
  const runs = [{}, { useComposedMovement: true }].map(options => {
    const { ai, target, play } = createFollower(options)
    const path = []
    for (let i = 0; i < 4; i++) {
      play(1.25)
      path.push([ai.state, ai.position.x, ai.position.z])
    }
    target.position.x -= 3
    play(.5)
    path.push([ai.state, ai.position.x, ai.position.z])
    return path
  })
  runs[0].forEach(([state, x, z], i) => {
    const [composedState, cx, cz] = runs[1][i]
    assert.equal(composedState, state, `state ${i}`)
    assert.ok(Math.abs(cx - x) < 1e-7 && Math.abs(cz - z) < 1e-7, `position ${i}`)
  })
})
