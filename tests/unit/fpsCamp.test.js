import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import campLayout from '/scenes/fps-base/campLayout.js'
import CampEnvironment, { models } from '/scenes/fps-base/CampEnvironment.js'
import { requestModels } from '/core3d/assets/models.js'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import World from '/core/World.js'
import SceneAudio from '/core/io/audio/SceneAudio.js'
import { fixture } from './helpers/audioBackend.js'

const randomFor = seed => {
  let value = seed
  return () => {
    value = Math.imul(value, 1664525) + 1013904223 | 0
    return (value >>> 0) / 4294967296
  }
}
const arrayBuffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

function modelFiles(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    texture.image = { width: 64, height: 64 }
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1254, height: 1254 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url =>
    new GLTFLoader().parseAsync(arrayBuffer(await readFile(url.slice(1))), url.slice(0, url.lastIndexOf('/') + 1)))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url =>
    new FBXLoader().parse(arrayBuffer(await readFile(url.slice(1))), ''))
  t.mock.method(OBJLoader.prototype, 'loadAsync', async url => new OBJLoader().parse(await readFile(url.slice(1), 'utf8')))
  t.mock.method(MTLLoader.prototype, 'loadAsync', async url => new MTLLoader().parse(await readFile(url.slice(1), 'utf8'), ''))
}

test('camp weapon shots play with active 3D audio at the moving player eye position', async t => {
  createPageElements()
  const { Prisoner } = await import('/scenes/fps-base/stealth.js')
  const { default: CampWeapons } = await import('/scenes/fps-base/CampWeapons.js')
  const { engine } = fixture()
  await engine.unlock()
  const player = new Prisoner({ x: -35, z: -35 })
  const audio = new SceneAudio({ engine, coordinates: { dimensions: 3, unitsPerAudioUnit: 1 },
    getListener: () => ({ position: player.eye, forward: player.aim, up: { x: 0, y: 1, z: 0 } }) })
  const weapons = new CampWeapons({ player, guardSounds: ['rifle.mp3', 'rifle-burst.mp3', 'fire-swoosh.mp3'] })
  t.after(async() => {
    weapons.end()
    audio.end()
    await engine.dispose()
  })
  audio.sync([weapons], 'running')
  for (const x of [-35, 12]) {
    player.x = x
    player.crouched = x > 0
    player.update(.2)
    for (const sound of weapons.sounds) {
      const voice = sound.play()
      assert.ok(voice, 'the active sound creates an actual audio voice')
      await voice.started
      assert.deepEqual(voice.spatialModel.position, player.eye)
      assert.equal(voice.paused, false)
      voice.dispose()
    }
  }
})

test('32 camp layouts retain connected branches and dead ends around the storehouse, with one joined yard and the original exit', () => {
  for (let seed = 1; seed <= 32; seed++) {
    const { maze, rooms, spawnPoints, walls } = campLayout(randomFor(seed))
    const visited = new Set([maze.first_cell]), pending = [maze.first_cell]
    while (pending.length) for (const next of Object.values(pending.pop().links)) if (!visited.has(next)) {
      visited.add(next)
      pending.push(next)
    }
    assert.equal(rooms.length, 56)
    assert.equal(visited.size, 56)
    assert.ok(visited.has(maze.last_cell))
    assert.ok(rooms.filter(cell => cell.links_length === 1).length >= 3)
    for (const cell of rooms) assert.ok(visited.has(cell))
    for (let row = 2; row <= 3; row++) for (let column = 2; column <= 5; column++)
      assert.equal(maze.cell(row, column).links_length, 0)
    for (const [a, b] of [[[4, 3], [4, 4]], [[4, 3], [5, 3]], [[5, 3], [5, 4]], [[4, 4], [5, 4]]])
      assert.ok(maze.cell(...a).linked(maze.cell(...b)))
    assert.deepEqual(maze.exitPosition, { x: 35, y: 0, z: 40 })
    assert.deepEqual(maze.tilePosition(1, 1), { x: -35, y: 0, z: -35 })
    assert.equal(spawnPoints.length, 54)
    for (const point of spawnPoints) {
      assert.ok(Math.hypot(point.x + 35, point.z + 35) > 5)
      assert.ok(!(point.x > -20 && point.x < 20 && point.z > -20 && point.z < 0))
    }
    assert.ok(walls.some(wall => wall.kind === 'timber'))
    assert.ok(walls.some(wall => wall.kind === 'wire'))
  }
})

test('real camp assembly blocks exactly the closed maze edges and lets the open exit and cell links through', async t => {
  modelFiles(t)
  await requestModels(models)
  const layout = campLayout(randomFor(9))
  const camp = new CampEnvironment(layout)
  const queries = camp.queries()
  const { default: CampNavigation } = await import('/scenes/fps-base/CampNavigation.js')
  const navigation = new CampNavigation(queries.isBlocked)
  assert.equal(navigation.clear({ x: -7.5116, z: 10.6565 }, { x: -7.5, z: 11.2 }), false,
    'a route must not clip the wider part of a sandbag above the crouching foot ray')
  for (const cell of layout.rooms) {
    const from = { ...layout.maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1), y: .89 }
    for (const [name, direction] of [['north', { x: 0, y: 0, z: -1 }], ['south', { x: 0, y: 0, z: 1 }],
      ['west', { x: -1, y: 0, z: 0 }], ['east', { x: 1, y: 0, z: 0 }]]) {
      const open = cell.linked(cell[name]) || cell === layout.maze.last_cell && name === 'south'
      assert.equal(queries.isBlocked(from, direction, 9), !open, `${cell.id} ${name}`)
    }
  }
  for (const kind of ['wire', 'timber']) {
    const wall = layout.walls.find(wall => wall.kind === kind)
    const x = (wall.a[0] + wall.b[0]) / 2, z = (wall.a[1] + wall.b[1]) / 2
    const dx = wall.b[0] - wall.a[0], dz = wall.b[1] - wall.a[1], length = Math.hypot(dx, dz)
    const from = { x: x + dz / length, y: .89, z: z - dx / length }
    const to = { x: x - dz / length, y: .89, z: z + dx / length }
    const direction = { x: to.x - from.x, y: 0, z: to.z - from.z }
    assert.equal(queries.isBlocked(from, direction, 2), true)
    assert.equal(queries.isBlocked({ ...from, y: 2.7 }, direction, 2), true, 'jumping still collides with the legs')
    assert.equal(queries.sees(from, to), kind === 'wire')
    assert.equal(queries.obstacleAt(from, direction, 2) < 2, kind === 'timber')
    if (kind === 'timber') {
      const impact = queries.impactAt(from, direction, 2)
      assert.ok(impact && !impact.object.isInstancedMesh, 'decal geometry receives the actual cover matrix')
    }
  }
  assert.equal(queries.groundAt(0, 0, 10), 0)
  for (const { x, z } of layout.sandbags) {
    const from = { x: x - 2, y: .6, z }, to = { x: x + 2, y: .6, z }
    assert.equal(queries.isBlocked({ ...from, y: 1.2 }, { x: 1, y: 0, z: 0 }, 4), true, 'sandbags stop walking')
    assert.equal(queries.sees(from, to), false, 'sandbags provide low cover')
    assert.equal(queries.sees({ ...from, y: 1.8 }, { ...to, y: 1.8 }), true, 'standing guards see over low sandbags')
    const impact = queries.impactAt(from, { x: 1, y: 0, z: 0 }, 4)
    assert.ok(impact && !impact.object.isInstancedMesh, 'sandbags receive actual bullet impacts')
  }
  assert.equal(camp.props[0].gateFraction, 1)
  assert.equal(camp.props.filter(prop => prop.lights.length).length, 2)
  assert.ok(camp.props.flatMap(prop => prop.lights).every(light => !light.castShadow))
  assert.equal(camp.mesh.children.filter(child => child.name === 'CampFence').length, 3, 'all wire and posts use three instanced draws')
  assert.ok(camp.mesh.children.filter(child => child.name === 'CampFence')
    .every(child => child.material.userData.outlineParameters.visible === false))
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
  crate.position.set(-35, .5, -35)
  crate.updateMatrixWorld(true)
  const from = { x: -36, y: .6, z: -35 }, to = { x: -34, y: .6, z: -35 }
  assert.equal(queries.sees(from, to), true)
  camp.walkSolids.push(crate)
  camp.opaqueSolids.push(crate)
  assert.equal(queries.sees(from, to), false, 'later props become cover for both player and AI')
  assert.equal(queries.isBlocked(from, { x: 1, y: 0, z: 0 }, 2), true)
  const released = []
  camp.mesh.traverse(part => {
    if (part.isInstancedMesh) part.addEventListener('dispose', () => released.push(part))
  })
  camp.end()
  camp.end()
  assert.equal(released.length, 4)
  assert.equal(new Set(released).size, 4, 'each owned instance buffer is released once')
})

test('camp crouch slows the prisoner, keeps his feet planted and suppresses sprint and jump', async() => {
  const { Prisoner, PrisonerKeys } = await import('/scenes/fps-base/stealth.js')
  const prisoner = new Prisoner({ jumping: 'fly' })
  const { size: { height }, feet } = prisoner
  let held = true
  const keys = new PrisonerKeys(prisoner, { keyboard: { isDown: () => held }, screen: {}, up: true, run: true, jump: true })
  keys.update(.2)
  prisoner.update(.2)
  assert.equal(prisoner.crouched, true)
  assert.equal(prisoner.running, false)
  assert.equal(prisoner.airborne, false)
  assert.ok(Math.abs(prisoner.steered.x - prisoner.speed * .45) < 1e-9)
  assert.ok(Math.abs(prisoner.size.height - height * .7) < 1e-9)
  assert.ok(Math.abs(prisoner.feet - feet) < 1e-9)
  held = false
  keys.input.jump = false
  keys.update(.2)
  prisoner.update(.2)
  assert.equal(prisoner.running, true)
  assert.equal(prisoner.size.height, height)
})

test('camp guards see a crouching prisoner at normal range only when he is lit and in view', async() => {
  const { CampGuard, Prisoner } = await import('/scenes/fps-base/stealth.js')
  const prisoner = new Prisoner({ x: 16, z: 0 })
  const sentry = new Prisoner({ x: 0, z: 0 })
  let lit = false, visible = true
  const guard = new CampGuard(sentry, { target: prisoner, sees: () => visible, litAt: () => lit })
  sentry.face(prisoner)
  assert.equal(guard.spotted, true)
  prisoner.crouched = true
  assert.equal(guard.spotted, false)
  lit = true
  assert.equal(guard.spotted, true)
  visible = false
  assert.equal(guard.spotted, false)
  visible = true
  lit = false
  prisoner.x = 8
  assert.equal(guard.spotted, true)

  prisoner.x = 10
  prisoner.steer({ ahead: 1, running: true })
  sentry.face({ x: -1, z: 0 })
  guard.chaseIfSpotted()
  assert.equal(guard.doing, 'wander')
  prisoner.crouched = false
  prisoner.steer({ ahead: 1, running: true })
  guard.chaseIfSpotted()
  assert.equal(guard.doing, 'pursue')
})

test('a camp searchlight reveals a point in its cone only while it is on and the beam is clear', () => {
  const lamp = new THREE.SpotLight(0xffffff, 1, 24, Math.PI / 6)
  lamp.position.set(0, 4, 0)
  lamp.target.position.set(0, 0, 10)
  const camp = { props: [{ lights: [lamp] }] }
  const litAt = (point, clear) => CampEnvironment.prototype.litAt.call(camp, point, clear)
  const underLight = { x: 0, y: 1.2, z: 7 }
  assert.equal(litAt(underLight, () => true), true)
  assert.equal(litAt(underLight, () => false), false)
  assert.equal(litAt({ x: -20, y: 0, z: 0 }, () => true), false)
  lamp.visible = false
  assert.equal(litAt(underLight, () => true), false)
})

test('FPS camp initializes with real model files, ten enemies and two first aids, and wins near the old exit with every guard alive', async t => {
  createPageElements()
  modelFiles(t)
  const { default: FpsBaseScene } = await import('/scenes/fps-base/Main.js')
  const { default: FPSRenderer } = await import('/core3d/actor/FPSRenderer.js')
  t.mock.method(FPSRenderer.prototype, 'render', () => {})
  const games = []
  const preloaded = [], shouted = []
  const fresh = () => {
    const game = Object.assign(Object.create(FpsBaseScene.prototype), {
      scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), world: new World(),
      session: new GameSession(), canvas: document.getElementById('platno'), syncSounds() {},
      sceneAudio: { output: { preload: file => preloaded.push(file) }, emit: (...args) => shouted.push(args) },
    })
    games.push(game)
    return game
  }
  const game = fresh()
  t.after(() => games.forEach(game => {
    game.world.end(game.player)
    game.disposeScene()
    game.session.dispose()
  }))
  await game.init()
  assert.ok(game.scene.getObjectByName('CrveniKrstCamp'))
  assert.equal(game.enemies.length, 10)
  assert.equal(game.firstAids.length, 2)
  assert.equal(game.camp.walkSolids.length, 13)
  assert.ok(game.enemies.every(enemy => Math.hypot(enemy.x - game.player.x, enemy.z - game.player.z) > 12))
  assert.equal(game.escapees.length, 3)
  assert.equal(new Set(game.escapees.map(({ body }) => body.name)).size, 3)
  assert.equal(new Set(game.escapees.map(({ body }) => body.size.height)).size, 3)
  const shirts = game.escapees.map(({ model }) => {
    let shirt
    model.mesh.traverse(part => {
      const match = [part.material].flat().find(material => material?.name === 'mat_15-27374EA0.jpg')
      if (match) shirt = `${match.map?.uuid}/${match.color.getHex()}`
    })
    return shirt
  })
  assert.equal(new Set(shirts).size, 3)
  assert.equal(new Set(game.escapees.map(({ model }) => model.actions.crouchIdle.time)).size, 3)
  assert.equal(new Set(game.escapees.map(({ model }) => model.actions.crouchIdle.timeScale)).size, 3)
  const standing = game.escapees.map(({ model }) => model.actions.idle.getClip().name)
  assert.equal(new Set(standing).size, 3, `each stands his own way: ${standing}`)
  for (const { body, model } of game.escapees) {
    assert.equal(body.crouched, true)
    assert.equal(model.chooseClip(), body.waitPose)
    assert.equal(model.actions.crouchIdle.getClip().name, 'Crouching Idle')
    assert.equal(model.actions.crouchRest.getClip().name, 'Crouch Idle')
    assert.equal(model.actions.crouchPeek.getClip().name, 'Crouch Look Around Corner')
    assert.equal(model.actions.crouchUp.getClip().name, 'Crouch To Stand')
    assert.equal(model.actions.crouchDown.getClip().name, 'Stand To Crouch')
    const hand = model.mesh.getObjectByName('mixamorigRightHand')
    model.update(0, 0)
    const start = hand.getWorldPosition(new THREE.Vector3())
    let movement = 0
    for (let frame = 0; frame < 180; frame++) {
      model.update(1 / 60, frame / 60)
      movement = Math.max(movement, hand.getWorldPosition(new THREE.Vector3()).distanceTo(start))
    }
    assert.ok(movement > .0005, `the recorded crouching idle moves ${body.name}'s hand and pipe: ${movement}`)
    const root = model.mesh.getObjectByName('mixamorigHips')
    const origin = root.position.clone()
    body.steer({ ahead: 1 })
    const walkFrames = Math.ceil(model.actions.crouchWalk.getClip().duration * 20 * 60) + 30
    for (let frame = 0; frame < walkFrames; frame++) {
      model.update(1 / 60, frame / 60)
      const scale = root.getWorldScale(new THREE.Vector3()).x
      assert.ok(Math.hypot(root.position.x - origin.x, root.position.z - origin.z) * scale < .01,
        'crouch walking stays within one centimetre of the idle horizontal origin throughout every loop')
    }
    body.steer()
    model.update(.3, 0)
    assert.equal(model.clip, body.waitPose)
    const head = model.mesh.getObjectByName('mixamorigHead')
    const postureHeight = (name, fraction) => {
      body.posture = { name, time: model.actions[name].getClip().duration * fraction }
      model.update(.3, 0)
      assert.equal(model.clip, name)
      return head.getWorldPosition(new THREE.Vector3()).y
    }
    const low = postureHeight('crouchUp', 0)
    const high = postureHeight('crouchUp', 1)
    assert.ok(high > low + .2, 'the recorded transition lifts the actual head')
    const reverseHigh = postureHeight('crouchDown', 0)
    const reverseLow = postureHeight('crouchDown', 1)
    assert.ok(reverseHigh > reverseLow + .2, 'reversing the recording lowers the actual head')
    body.posture = null
    model.update(.3, 0)
    body.crouched = false
    body.steer({ ahead: 1, running: true })
    body.vx = 4.6
    body.vz = 0
    model.update(.1, 0)
    assert.equal(model.clip, 'run')
    assert.ok(model.actions.run.timeScale > 1 && model.actions.run.timeScale <= 1.15,
      'the actual running clip speeds up by at most fifteen percent')
    body.vx = 3
    model.update(.1, 0)
    assert.ok(model.actions.run.timeScale < 1 && model.actions.run.timeScale >= .85)
    body.vx = body.vz = 0
    body.crouched = true
    body.steer()
    model.update(.3, 0)
  }
  const leaderStart = { x: game.player.x, z: game.player.z }
  for (const { controller, body, model } of game.escapees) {
    assert.equal(model.actions.walk.getClip().name, 'Walk', 'escapees use the worker walking clip')
    assert.equal(model.actions.run.getClip().name, 'Running', 'escapees run with the downloaded unarmed animation')
    assert.equal(model.actions.attack.getClip().name, 'One Hand Sword Combo')
    assert.equal(model.mesh.getObjectByName('MetalPipe').parent.name, 'mixamorigRightHand')
    controller.enemies = []
    body.targets = []
    controller.update(.1)
    assert.equal(body.moving, false, 'companions wait near the player instead of leaving for the gate')
  }
  game.player.x = 35
  game.player.z = 35
  const following = ({ body, controller }) => {
    const point = controller.formationPoint()
    return Math.hypot(body.x - point.x, body.z - point.z) < .4
  }
  for (let step = 0; step < 30000 && !game.escapees.every(following); step++)
    for (const { body, controller } of game.escapees) {
      controller.update(1 / 30)
      body.update(1 / 30)
    }
  assert.ok(game.escapees.every(following), JSON.stringify(game.escapees.map(({ body, controller }) => ({
    x: body.x, z: body.z, blocked: body.blocked, route: controller.route.slice(0, 2), state: controller.state,
  }))))
  for (let i = 0; i < game.escapees.length; i++) for (let j = i + 1; j < game.escapees.length; j++) {
    const a = game.escapees[i].body, b = game.escapees[j].body
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > .75, 'companions stop in separate places')
  }
  Object.assign(game.player, leaderStart)
  assert.deepEqual(preloaded, ['halt.mp3'])
  const sentry = game.enemies[0]
  sentry.x = game.player.x + 5
  sentry.z = game.player.z
  sentry.face(game.player)
  const guardAI = game.controllers.find(controller => controller.body === sentry)
  let visible = false
  guardAI.sees = () => visible
  guardAI.update(0)
  assert.equal(shouted.length, 0)
  visible = true
  guardAI.update(0)
  assert.equal(guardAI.doing, 'pursue')
  assert.equal(shouted[0][0], 'halt.mp3')
  assert.deepEqual(shouted[0][1].spatial.position, sentry.eye)
  visible = false
  guardAI.update(0)
  assert.equal(guardAI.doing, 'search')
  visible = true
  guardAI.update(0)
  assert.equal(guardAI.doing, 'attack')
  assert.equal(shouted.length, 1, 'seeing the prisoner again does not repeat the first shout')
  const wins = []
  game.victory = text => wins.push(text)
  game.defeat = () => assert.fail('the player is alive')
  const { x, z } = game.maze.exitPosition
  game.player.x = x
  game.player.z = z - 5.01
  game.update(0, 0)
  assert.equal(wins.length, 0)
  game.player.z = z - 4.99
  game.update(0, 0)
  assert.equal(wins.length, 1)
  assert.ok(game.enemies.every(enemy => enemy.alive))
  const repeat = fresh()
  await repeat.init()
  assert.notEqual(repeat.camp, game.camp)
  assert.equal(repeat.enemies.length, 10)
  assert.equal(repeat.firstAids.length, 2)
  assert.equal(repeat.camp.props[0].gateFraction, 1)
  assert.deepEqual([repeat.player.x, repeat.player.z], [-35, -35])
  assert.equal(repeat.camp.props.flatMap(prop => prop.lights).length, 2)

  const weapons = repeat.children.find(child => child.guards)
  const [guard] = weapons.guards
  const { avatar } = weapons
  const firstPerson = repeat.children.find(child => child.showTarget)
  firstPerson.update(0)
  assert.equal(firstPerson.renderer.showTarget, true, 'the initial rifle has a crosshair')
  assert.equal(firstPerson.renderer.weaponSrc, '/assets/images/ui/savo.png', 'the initial rifle uses the original 2D drawing')
  assert.equal(avatar.current.pose, 'rifle')
  assert.equal(repeat.player.reach, 100)
  assert.equal(repeat.player.actions.attack, .48)
  const playerKeys = repeat.controllers.find(controller => controller.body === repeat.player && controller.input)
  repeat.player.face({ x: 0, z: -10 })
  const beforeShot = repeat.player.shotsFired
  playerKeys.input.keyboard.pressed.pointer = true
  repeat.world.update(1 / 60, 0)
  assert.equal(repeat.player.state, 'attack', 'the actual firing input starts a shot')
  playerKeys.input.keyboard.pressed.pointer = false
  for (let frame = 1; frame < 45; frame++) {
    repeat.world.update(1 / 60, frame / 60)
    await new Promise(resolve => {
      setTimeout(resolve, 0)
    })
  }
  assert.equal(repeat.player.shotsFired, beforeShot + 1)
  assert.ok(weapons.playerView.ricochet, 'the shot runs through the real model impact effects')
  repeat.player.attack()
  const { length } = repeat.player.swing
  repeat.player.swingOn(length / 2)
  avatar.update(length / 2)
  assert.equal(avatar.action.getClip().name, 'Firing Rifle')
  repeat.player.swingOn(length / 2)
  avatar.update(length / 2)
  assert.equal(avatar.action.getClip().name, 'Rifle Aiming Idle')
  const standingHead = repeat.viewCamera.position.y
  repeat.player.crouched = true
  avatar.update(.2)
  assert.equal(avatar.action.getClip().name, 'Crouched Walking')
  assert.equal(avatar.action.paused, true)
  assert.ok(repeat.viewCamera.position.y < standingHead - .15)
  repeat.player.vx = .9
  avatar.update(.2)
  assert.equal(avatar.action.paused, false)
  assert.ok(avatar.current.grip.visible)
  for (let step = 0; step < 62; step++) {
    avatar.update(1 / 60)
    assert.ok(avatar.current.grip.visible)
  }
  repeat.player.vx = 0
  repeat.player.crouched = false
  avatar.update(.2)
  assert.ok(Math.abs(repeat.viewCamera.position.y - standingHead) < .01)
  guard.body.takeHit(guard.body.health.current)
  assert.equal(weapons.pickUp(), false, 'a distant guard cannot be looted')
  guard.body.x = repeat.player.x + 1
  guard.body.z = repeat.player.z
  assert.equal(weapons.pickUp(), true)
  assert.equal(weapons.avatar.current.grip.name, guard.model.file)
  firstPerson.update(0)
  assert.equal(firstPerson.renderer.showTarget, true, 'a captured firearm restores the crosshair')
  assert.ok(repeat.player.reach > 1.65)
  assert.equal(guard.carried.visible, false)
  assert.equal(weapons.pickUp(), false, 'the same weapon transfers only once')

  const surface = repeat.camp.mesh.children.find(mesh => mesh.name === 'CampFence').material
  let disposed = false
  surface.addEventListener('dispose', () => {
    disposed = true
  })
  repeat.disposeScene()
  assert.equal(disposed, true, 'scene disposal owns the new fence materials')
})

test('on a touch screen the sneak button, held, crouches the prisoner and the hand button takes a weapon once per press', async t => {
  const { Prisoner, PrisonerKeys } = await import('/scenes/fps-base/stealth.js')
  const { default: CampWeapons } = await import('/scenes/fps-base/CampWeapons.js')
  const prisoner = new Prisoner({})
  const screen = { special: true }
  new PrisonerKeys(prisoner, { keyboard: { isDown: () => false }, screen }).update(.2)
  assert.equal(prisoner.crouched, true)
  const weapons = new CampWeapons({ player: prisoner, guardSounds: [], canTake: () => true, touch: screen })
  t.after(() => weapons.end())
  const pickUp = t.mock.method(weapons, 'pickUp', () => true)
  for (const pressed of [true, true, false, true]) {
    screen.attack2 = pressed
    weapons.update()
  }
  assert.equal(pickUp.mock.callCount(), 2)
})
