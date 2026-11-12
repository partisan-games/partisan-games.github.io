import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, PerspectiveCamera, Scene, Texture, TextureLoader } from 'three'
import { createPageElements } from './helpers/dom.js'
import Avatar from '/core3d/actor/Avatar.js'
import GameSession from '/core/runtime/GameSession.js'
import SpecialActions from '/scenes/capoeira-girl/SpecialActions.js'

before(() => createPageElements())
const input = () => ({ end() {} })

test('all avatar profiles keep their flight and lava abilities and independent visual time', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  const stone = new Avatar({ skin: 'STONE', input: input() })
  const lava = new Avatar({ skin: 'LAVA', input: input() })
  const disco = new Avatar({ skin: 'DISCO', input: input() })
  t.after(() => [stone, lava, disco].forEach(avatar => avatar.end()))
  assert.equal(stone.jumpStyle, 'FLY_JUMP')
  assert.equal(lava.jumpStyle, 'FLY_JUMP')
  assert.equal(disco.jumpStyle, 'FLY')
  assert.equal(stone.immuneToLava, false)
  assert.equal(lava.immuneToLava, true)
  assert.equal(disco.immuneToLava, false)
  assert.ok(stone.movement && lava.movement && disco.movement)
  stone.update(.5)
  const pose = stone.limbs.map(limb => limb.position.z)
  disco.update(.5)
  assert.deepEqual(disco.limbs.map(limb => limb.position.z), pose)
  stone.update(.5)
  assert.deepEqual(disco.limbs.map(limb => limb.position.z), pose)
})

test('choosing an avatar twice while its module resolves creates exactly one player', async t => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const session = new GameSession()
  let added = 0
  let starts = 0
  const scene = {
    session, ui: { ended: false }, scene: new Scene(), camera: new PerspectiveCamera(),
    ground: new Mesh(new BoxGeometry(10, 1, 10)), boxes: [],
    addMesh: () => added++, createCoins() {}, start: () => starts++,
  }
  const target = document.createElement('input')
  target.id = 'DISCO'
  await Promise.all([AvatarScene.prototype.handleClick.call(scene, { target }), AvatarScene.prototype.handleClick.call(scene, { target })])
  t.after(() => scene.player.end())
  assert.equal(added, 1)
  assert.equal(starts, 1)
})

test('a late avatar choice cannot create a player in a disposed scene', async() => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  const session = new GameSession()
  const scene = { session, ui: { ended: false } }
  const target = document.createElement('input')
  target.id = 'DISCO'
  const pending = AvatarScene.prototype.handleClick.call(scene, { target })
  session.dispose()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(scene.player, undefined)
})

const deferred = () => {
  let resolve
  const promise = new Promise(done => {
    resolve = done
  })
  return { promise, resolve }
}

test('special actions share pending loads and only the latest choice changes state', async() => {
  const session = new GameSession()
  const first = deferred()
  const second = deferred()
  const states = []
  let loads = 0
  let added = 0
  const player = {
    anim: { actions: {} },
    addAction(name, clip) {
      this.anim.actions[name] = clip
      added++
    },
    setState: name => states.push(name),
  }
  const actions = new SpecialActions({ player, session, loadClip: name => {
    loads++
    return name === 'first' ? first.promise : second.promise
  } })
  const a = actions.select('first')
  const repeat = actions.select('first')
  const b = actions.select('second')
  second.resolve(new AnimationClip('second', 1, []))
  await b
  first.resolve(new AnimationClip('first', 1, []))
  await Promise.all([a, repeat])
  assert.equal(loads, 2)
  assert.equal(added, 2)
  assert.deepEqual(states, ['second'])
  const late = deferred()
  actions.loadClip = () => late.promise
  const pending = actions.select('late')
  session.dispose()
  late.resolve(new AnimationClip('late', 1, []))
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(player.anim.actions.late, undefined)
})

test('capoeira controls and styles belong to the scene scope', async() => {
  const { default: Capoeira } = await import('/scenes/capoeira-girl/Main.js')
  const session = new GameSession()
  const scene = { session }
  Capoeira.prototype.addUI.call(scene)
  assert.ok(scene.uiElements.every(element => element.isConnected))
  assert.equal(scene.style.isConnected, true)
  session.dispose()
  assert.ok(scene.uiElements.every(element => !element.isConnected))
  assert.equal(scene.style.isConnected, false)
})

test('avatar lava damage and coin collection keep their game rules', async t => {
  const { default: AvatarScene } = await import('/scenes/avatar/Main.js')
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  for (const skin of ['STONE', 'LAVA']) {
    const player = new Avatar({ skin, input: input() })
    t.after(() => player.end())
    const coin = { mesh: new Mesh(new BoxGeometry()) }
    coin.mesh.position.set(50, 10, 0)
    let removed = 0
    const scene = {
      player, predmeti: [], coins: [coin], score: 0, ui: { outro: false, showMessage() {} },
      lava: { material: { uniforms: { time: { value: 0 } } } },
      removeMesh: () => removed++, showMotivationalMessage() {}, defeat() {}, victory() {},
      checkCollision: AvatarScene.prototype.checkCollision,
    }
    AvatarScene.prototype.update.call(scene, 1, 1)
    assert.equal(player.energy, skin === 'LAVA' ? 100 : 94)
    coin.mesh.position.copy(player.position)
    scene.checkCollision(coin)
    assert.equal(scene.score, 1)
    assert.equal(scene.coins.length, 0)
    assert.equal(removed, 1)
  }
})
