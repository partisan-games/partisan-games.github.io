import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene } from 'three'
import AI from '/core3d/actor/AI.js'

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

/** Like the golem, the follower's forward ray hits the target before it gets within followDistance. */
function createFollower() {
  const scene = new Scene()
  const target = createBody(2)
  target.name = 'player'
  const ai = new AI({ mesh: createBody(2.5), pos: [6, 0, 0], baseState: 'follow', target })
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
