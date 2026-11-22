import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, PerspectiveCamera, Scene, Texture, TextureLoader } from 'three'
import { createPageElements } from './helpers/dom.js'
import makeAvatar, { avatarAbilities } from '/core3d/actor/characters/Avatar.js'
import GameSession from '/core/runtime/GameSession.js'
import SpecialActions from '/scenes/capoeira-girl/SpecialActions.js'
import World from '/core/World.js'
import Character from '/core/gameplay/bodies/characters/Character.js'

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

const deferred = () => {
  let resolve
  const promise = new Promise(done => {
    resolve = done
  })
  return { promise, resolve }
}

test('special actions share pending loads and only the latest choice changes state', async() => {
  const session = new GameSession()
  session.start() // special actions play only while the game runs
  const first = deferred()
  const second = deferred()
  const states = []
  let loads = 0
  let added = 0
  const model = { actions: {} }
  model.anim = {
    addAction(name, clip) {
      model.actions[name] = clip
      added++
    },
  }
  const body = { actions: {}, attack: name => states.push(name) }
  const actions = new SpecialActions({ body, model, session, loadClip: name => {
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
  assert.equal(model.actions.late, undefined)
})

test('the latest special waits for a busy character and starts once through the world controller', async() => {
  const session = new GameSession()
  session.start()
  const body = new Character({ actions: { first: 1, second: 1, third: 1 } })
  const actions = new SpecialActions({ body, model: { actions: body.actions }, session })
  const world = new World()
  world.controllers.push(actions)
  world.add(body)
  await actions.select('first')
  await actions.select('second')
  await actions.select('third')
  assert.equal(body.swing.kind, 'first')
  world.update(1.1)
  world.update(.1)
  assert.equal(body.swing.kind, 'third')
  world.update(1.1)
  world.update(.1)
  assert.equal(body.swing, null, 'the queued selection plays only once')
})

test('a newer loading choice replaces the queue and waits through pain and pause', async() => {
  const session = new GameSession()
  session.start()
  const body = new Character({ actions: { first: .5, second: 1, pain: 1 } })
  const model = { actions: { first: {}, second: {} } }
  model.anim = { addAction(name, clip) {
    model.actions[name] = clip
  } }
  const loaded = deferred()
  const actions = new SpecialActions({ body, model, session, loadClip: () => loaded.promise })
  await actions.select('first')
  await actions.select('second')
  const pending = actions.select('third')
  body.update(.6)
  actions.update()
  assert.equal(body.swing, null, 'a stale ready choice cannot pass the latest loading choice')
  body.takeHit(1)
  session.pause()
  loaded.resolve(new AnimationClip('third', 1, []))
  await pending
  actions.update()
  assert.equal(body.swing, null, 'nothing starts while paused')
  session.resume()
  actions.update()
  assert.equal(body.swing, null, 'nothing starts while reeling')
  body.update(1.1)
  actions.update()
  assert.equal(body.swing.kind, 'third')
})

test('a queued special cannot start after the character dies or the session ends', async() => {
  for (const ending of ['death', 'finish', 'dispose']) {
    const session = new GameSession()
    session.start()
    const body = new Character({ actions: { first: 1, second: 1 } })
    const actions = new SpecialActions({ body, model: { actions: body.actions }, session })
    await actions.select('first')
    await actions.select('second')
    if (ending === 'death') body.takeHit(1000)
    else session[ending]()
    body.update(2)
    actions.update()
    assert.equal(body.swing, null, ending)
  }
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
