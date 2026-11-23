import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, BoxGeometry, Mesh, PerspectiveCamera, Scene, Texture, TextureLoader } from 'three'
import World from '/core/World.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import makeAvatar from '/core3d/actor/characters/Avatar.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import LiftPlatform from '/scenes/avatar/LiftPlatform.js'
import { createPageElements } from './helpers/dom.js'

function riding(t, axis = 'x', speed = 2) {
  createPageElements()
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  let body
  const platform = new LiftPlatform({ pos: { x: 0, y: 4, z: 0 }, axis, speed, file: null, getPlayer: () => body })
  const made = makeAvatar({ ...worldQueries([platform.mesh]) })
  ;({ body } = made)
  body.y = 5 + body.size.height / 2
  const input = {}, world = new World()
  world.controllers.push(new CharacterKeys(body, input))
  world.add(platform, body, made.model)
  t.after(() => world.end())
  return { platform, body, model: made.model, input, world }
}

for (const axis of ['x', 'y', 'z']) for (const speed of [-2, 2])
  test(`the lift carries body and visible avatar on ${axis} at speed ${speed}`, t => {
    const { platform, body, model, world } = riding(t, axis, speed)
    for (let frame = 0; frame < 120; frame++) {
      world.update(1 / 60)
      assert.ok(Math.abs(body.x - platform.position.x) < 1e-6)
      assert.ok(Math.abs(body.z - platform.position.z) < 1e-6)
      assert.ok(Math.abs(body.feet - platform.position.y - 1) < 1e-6)
      assert.equal(model.mesh.position.x, body.x)
      assert.equal(model.mesh.position.z, body.z)
      assert.equal(model.mesh.position.y, body.feet)
    }
  })

test('jumping detaches the avatar immediately, and a nearby or dead avatar is not carried', t => {
  const { platform, body, input, world } = riding(t)
  world.update(.1)
  input.jump = true
  const { x } = body
  world.update(.1)
  assert.equal(body.x, x)
  assert.ok(body.feet > platform.position.y + 1)
  input.jump = false
  body.vy = 0
  body.y = platform.position.y + 1 + body.size.height / 2
  body.z = platform.position.z + 3
  world.update(.1)
  assert.equal(body.x, x, 'height and x alone are insufficient: the avatar must be over the deck in z too')
  body.z = platform.position.z
  body.takeHit(body.health.maximum)
  world.update(.1)
  assert.equal(body.x, x)
})

test('an avatar descending onto a moving deck lands and then travels with it', t => {
  const { platform, body, world } = riding(t)
  body.y += 3
  let landed = false
  for (let i = 0; i < 120; i++) {
    world.update(1 / 60)
    if (Math.abs(body.feet - platform.position.y - 1) < .001) {
      landed = true
      break
    }
  }
  assert.ok(landed)
  const relative = body.x - platform.position.x
  for (let i = 0; i < 30; i++) world.update(1 / 60)
  assert.ok(Math.abs(body.x - platform.position.x - relative) < 1e-6)
})

test('the actual scene updates its lifts before the player and visual model', async t => {
  createPageElements()
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  t.mock.method(Math, 'random', () => .9)
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const { default: GameSession } = await import('/core/runtime/GameSession.js')
  const world = new World()
  const scene = Object.assign(Object.create(AvatarScene.prototype), {
    session: new GameSession(), world, ui: { ended: false }, scene: new Scene(), camera: new PerspectiveCamera(),
    ground: new Mesh(new BoxGeometry(2000, 1, 2000)),
    boxes: Array.from({ length: 100 }, (_, i) => {
      const mesh = new Mesh(new BoxGeometry(5, 5, 5))
      mesh.position.set(i * 20, 2.5, 0)
      return mesh
    }),
    add(...objects) {
      world.add(...objects)
      this.scene.add(...objects.filter(object => object.mesh).map(object => object.mesh))
    },
  })
  t.after(() => world.end())
  await scene.prepare('STONE')
  const platforms = world.objects.filter(object => object instanceof LiftPlatform)
  assert.equal(platforms.length, 100)
  assert.ok(platforms.every(platform => world.objects.indexOf(platform) < world.objects.indexOf(scene.player)))
  const first = platforms[0]
  scene.player.x = first.position.x
  scene.player.z = first.position.z
  scene.player.y = first.position.y + 1 + scene.player.size.height / 2
  const before = scene.player[first.axis]
  world.update(1 / 60)
  assert.notEqual(scene.player[first.axis], before)
  assert.equal(scene.avatarModel.mesh.position.x, scene.player.x)
  assert.equal(scene.avatarModel.mesh.position.z, scene.player.z)
  assert.equal(scene.avatarModel.mesh.position.y, scene.player.feet)
})

test('a lift moving into a standing avatar pushes it ahead, and one rising under it lifts it onto the deck', t => {
  createPageElements()
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  for (const [axis, speed, pos] of [['x', -2, { x: 0, y: .5, z: 0 }], ['y', 2, { x: -4, y: -.9, z: 0 }]]) {
    let body
    const platform = new LiftPlatform({ pos, axis, speed, file: null, getPlayer: () => body })
    ;({ body } = makeAvatar({ ...worldQueries([platform.mesh]) }))
    body.x = -4
    const world = new World()
    world.add(platform, body)
    t.after(() => world.end())
    for (let frame = 0; frame < 90; frame++) {
      world.update(1 / 60)
      const { min, max } = new Box3().setFromObject(platform.mesh)
      const half = body.size.length / 2
      const overlaps = body.x + half > min.x + 1e-6 && body.x - half < max.x - 1e-6
        && body.feet < max.y - 1e-6 && body.feet + body.size.height > min.y
      assert.equal(overlaps, false, `frame ${frame} on ${axis}`)
    }
    if (axis === 'x') assert.ok(body.x < -5, 'the avatar was pushed')
    else assert.ok(Math.abs(body.feet - (platform.position.y + 1)) < 1e-6, 'the avatar rides the rising deck')
  }
})
