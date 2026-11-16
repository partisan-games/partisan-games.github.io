import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, Scene } from 'three'
import Tower from '/core3d/objects/Tower.js'
import GameObject from '/core3d/objects/GameObject.js'

const box = () => new Mesh(new BoxGeometry(1, 2, 1))

test('a tower fires at a player in range after its interval of game time, and waits while the game does not run', () => {
  const scene = new Scene()
  const tower = new Tower({ mesh: box(), interval: 500 })
  const player = new GameObject({ mesh: box(), name: 'player' }).mesh
  player.position.set(5, 0, 0)
  scene.add(tower.mesh, player)

  for (let i = 0; i < 29; i++) tower.update(1 / 60)
  assert.equal(tower.bullets.length, 0, 'not before .5 s of game time')
  // a long pause: no updates, however much time the wall clock shows
  for (let i = 0; i < 2; i++) tower.update(1 / 60)
  assert.equal(tower.bullets.length, 1)
})
