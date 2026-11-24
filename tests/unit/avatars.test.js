import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, PerspectiveCamera, Scene, Texture, TextureLoader } from 'three'
import { createPageElements } from './helpers/dom.js'
import makeAvatar, { avatarAbilities } from '/core3d/actor/characters/Avatar.js'
import GameSession from '/core/runtime/GameSession.js'
import World from '/core/World.js'

before(() => createPageElements())

test('all avatar skins keep their flight and lava abilities, and each poses on its own time', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  const [stone, lava, disco] = ['STONE', 'LAVA', 'DISCO'].map(skin => makeAvatar({ skin }))
  assert.equal(stone.body.maxLift, lava.body.maxLift)
  assert.equal(disco.body.maxLift, Infinity, 'a disco ball flies as long as jump is held')
  assert.deepEqual(['STONE', 'LAVA', 'DISCO'].map(skin => avatarAbilities[skin].immuneToLava), [false, true, false])
  stone.model.update(.5)
  const pose = stone.model.limbs.map(limb => limb.position.z)
  disco.model.update(.5)
  assert.deepEqual(disco.model.limbs.map(limb => limb.position.z), pose)
  stone.model.update(.5)
  assert.deepEqual(disco.model.limbs.map(limb => limb.position.z), pose, 'the pose of one avatar does not move another')
})

test('choosing an avatar twice while its module resolves creates exactly one player, who flies as its skin does', async t => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const session = new GameSession()
  let added = 0
  let starts = 0
  session.ready()
  const scene = Object.assign(Object.create(AvatarScene.prototype), {
    session, ui: { ended: false }, scene: new Scene(), camera: new PerspectiveCamera(), world: { controllers: [] },
    ground: new Mesh(new BoxGeometry(10, 1, 10)), boxes: [],
    add: () => added++, createCoins() {}, start: () => starts++,
  })
  await Promise.all([scene.play('DISCO'), scene.play('DISCO')])
  t.after(() => scene.world.controllers.forEach(controller => controller.end()))
  assert.equal(added, 1)
  assert.equal(starts, 1)
  assert.equal(scene.player.maxLift, Infinity, 'a disco ball flies as long as jump is held')
})

test('a late avatar choice cannot create a player in a disposed scene', async() => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const session = new GameSession()
  const scene = { session, ui: { ended: false } }
  const pending = AvatarScene.prototype.prepare.call(scene, 'DISCO')
  session.dispose()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(scene.player, undefined)
})

test('avatar lava damage and coin collection, with its ring, keep their game rules', async t => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  for (const skin of ['STONE', 'LAVA']) {
    const { body: player, model } = makeAvatar({ skin })
    let rang = 0
    const coin = { mesh: new Mesh(new BoxGeometry()), playSound: () => rang++ }
    coin.mesh.position.set(50, 10, 0)
    let removed = 0
    const scene = {
      player, avatarModel: model, immuneToLava: avatarAbilities[skin].immuneToLava, world: new World(), coins: [coin],
      score: 0, ui: { outro: false, showMessage() {} },
      lava: { material: { uniforms: { time: { value: 0 } } } },
      removeMesh: () => removed++, showMotivationalMessage() {}, defeat() {}, victory() {},
      checkCollision: AvatarScene.prototype.checkCollision,
    }
    AvatarScene.prototype.update.call(scene, 1, 1)
    assert.equal(player.health.current, skin === 'LAVA' ? 100 : 94)
    coin.mesh.position.copy(model.mesh.position)
    scene.checkCollision(coin)
    assert.equal(scene.score, 1)
    assert.equal(scene.coins.length, 0)
    assert.equal(removed, 1)
    assert.equal(rang, 1, 'a taken coin rings')
  }
})
