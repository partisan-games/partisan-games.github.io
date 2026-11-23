import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, BoxGeometry, Mesh, PerspectiveCamera, Scene, Texture, TextureLoader, Vector3 } from 'three'
import World from '/core/World.js'
import makeAvatar from '/core3d/actor/characters/Avatar.js'
import { jumpArc, reachableBoxes } from '/scenes/avatar/reachableBoxes.js'
import { createPageElements } from './helpers/dom.js'

/** A 5 m cube standing with its top at `top`. */
const cube = (x, top, z = 0) => new Box3(new Vector3(x - 2.5, top - 5, z - 2.5), new Vector3(x + 2.5, top, z + 2.5))

test('a stone avatar reaches a high cube only up a staircase of cubes within its jump', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  const arc = jumpArc(groundAt => makeAvatar({ skin: 'STONE', maxLift: .99, groundAt }).body)
  const low = cube(0, 8), lone = cube(200, 30)
  const stairs = [cube(-20, 8), cube(-13, 16), cube(-6, 24), cube(1, 32, 8)]
  const reached = reachableBoxes([low, lone, ...stairs], arc)
  assert.deepEqual(reached, [low, ...stairs])
})

test('the scene puts no coin above a cube the avatar cannot reach', async t => {
  createPageElements()
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  t.mock.method(Math, 'random', () => .5) // no lifts
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const { default: GameSession } = await import('/core/runtime/GameSession.js')
  const world = new World()
  const boxes = Array.from({ length: 101 }, (_, i) => {
    const mesh = new Mesh(new BoxGeometry(5, 5, 5))
    mesh.position.set(i * 20, 2.5, 0)
    return mesh
  })
  boxes[0].position.set(-500, 47.5, 0)
  const scene = Object.assign(Object.create(AvatarScene.prototype), {
    session: new GameSession(), world, ui: { ended: false }, scene: new Scene(), camera: new PerspectiveCamera(),
    ground: new Mesh(new BoxGeometry(2000, 1, 2000)), boxes,
    add(...objects) {
      world.add(...objects)
    },
  })
  t.after(() => world.end())
  await scene.prepare('STONE')
  assert.equal(scene.coins.length, 100)
  assert.ok(scene.coins.every(coin => coin.mesh.position.x > -400))
})
