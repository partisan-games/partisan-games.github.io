import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, BoxGeometry, Scene, AmbientLight, Group, Vector3, PerspectiveCamera } from 'three'
import config from '/config.js'
import SceneAudio from '/core/io/audio/SceneAudio.js'
import SoundSource from '/core/io/audio/SoundSource.js'
import GameSession from '/core/runtime/GameSession.js'
import GameClock from '/core/runtime/GameClock.js'
import ResourceScope from '/core/runtime/ResourceScope.js'
import { audioPosition, audioListener } from '/core/io/audio/audio3d.js'
import { createPageElements } from './helpers/dom.js'
import { fixture } from './helpers/audioBackend.js'

before(() => createPageElements())
const settle = async() => {
  for (let i = 0; i < 24; i++) await Promise.resolve()
}
async function audioFor(t, dimensions = 2) {
  const backend = fixture()
  await backend.engine.unlock()
  const player = { position: { x: 0, y: 0, z: 0 }, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 }, identity: 'player' }
  const audio = new SceneAudio({ engine: backend.engine, coordinates: { dimensions, unitsPerAudioUnit: dimensions === 2 ? 100 : 1 }, getListener: () => player })
  t.after(async() => {
    audio.end(); await backend.engine.dispose()
  })
  return { ...backend, audio, player }
}

test('different soldiers have independent shot points and sound randomness does not consume gameplay random', async t => {
  const { audio, engine } = await audioFor(t)
  const { default: Occupier } = await import('/core/gameplay/bodies/soldiers/Occupier.js')
  const { default: FrontEnemySprite } = await import('/core/actor/soldiers/FrontEnemySprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const projection = sideProjection({ pxPerMeter: 22, groundY: 600 })
  const [first, second] = [5, 25].map(x => new FrontEnemySprite(new Occupier({ x }), { projection }))
  audio.sync([first, second], 'running')
  for (const soldier of [first, second]) soldier.shotSound.play()
  assert.notEqual(first.shotSound.playback.audio, second.shotSound.playback.audio)
  assert.notDeepEqual(first.shotSound.playback.audio.spatialModel.position, second.shotSound.playback.audio.spatialModel.position)
  await settle()
  const random = t.mock.method(Math, 'random', () => {
    throw new Error('audio touched gameplay random')
  })
  const voice = first.shotSound.play()
  random.mock.restore()
  await voice.started
  assert.equal(engine.master.gain.value, config.volume)
  const group = audio.output.groupDestination('effects', engine.context)
  assert.equal(group.gain.value, audio.output.groupLevels.effects)
  assert.equal(voice.processing.gain.gain.value, voice.volume * voice.profile.trim * voice.variationVolume * voice.spatialState.gain)
})

test('a trench firing transition starts one repeating burst instead of replaying the entire clip per bullet', async t => {
  const { audio } = await audioFor(t)
  const { default: TrenchSoldier } = await import('/core/gameplay/bodies/soldiers/TrenchSoldier.js')
  const { default: TrenchSoldierSprite } = await import('/core/actor/soldiers/TrenchSoldierSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const body = new TrenchSoldier()
  const soldier = new TrenchSoldierSprite(body, { projection: sideProjection({ pxPerMeter: 22, groundY: 400 }) })
  audio.sync([soldier], 'running')
  body.setState('aim'); body.setState('attack')
  soldier.update(0); soldier.update(.1)
  await settle()
  assert.equal(soldier.burstSound.options.loop, true)
  assert.equal(soldier.burstSound.playback.voices.size, 1)
  body.setState('dead')
  soldier.update(0)
  assert.equal(soldier.burstSound.playing, false)
})

test('3D points include parent transforms and remain independent of camera placement', () => {
  const parent = new Group(), mesh = new Mesh(new BoxGeometry())
  parent.position.set(10, 20, 30)
  mesh.position.set(1, 2, 3)
  parent.add(mesh)
  assert.deepEqual(audioPosition(mesh).toArray(), [11, 22, 33])
  parent.position.x = 40
  assert.deepEqual(audioPosition(mesh).toArray(), [41, 22, 33])
})

test('model forward axes and an attached FPS view define orientation while camera offsets never move the listener', () => {
  const mesh = new Mesh(new BoxGeometry()), camera = new PerspectiveCamera()
  mesh.position.set(1, 2, 3)
  camera.position.set(500, 20, 100)
  const player = { mesh, camera }
  assert.deepEqual(audioListener(player).position.toArray(), [1, 2, 3])
  assert.deepEqual(audioListener(player).forward.toArray(), [0, 0, -1])
  const vehicle = { mesh, audioForward: { x: 0, y: 0, z: 1 } }
  assert.deepEqual(audioListener(vehicle).forward.toArray(), [0, 0, 1])
  mesh.add(camera)
  camera.rotation.y = Math.PI / 2
  const listener = audioListener(player)
  assert.deepEqual(listener.position.toArray(), [1, 2, 3])
  assert.ok(listener.forward.x < -.999)
  assert.throws(() => audioListener({ camera }), /actual player/)
})

test('rain has one scene-owned ambient loop and stops with the session', async t => {
  const { audio } = await audioFor(t, 3)
  const { Rain } = await import('/core3d/Particles.js')
  const rain = new Rain({ num: 1 })
  audio.sync([rain], 'running')
  rain.update(1 / 60); rain.update(1 / 60)
  await settle()
  assert.equal(rain.audio.playback.voices.size, 1)
  assert.equal(rain.audio.playback.options.profile.group, 'ambience')
  audio.end()
  assert.equal(rain.audio.playback.audio.disposed, true)
})

test('weather thunder keeps its one delay and uses explicit nonspatial ambience without a second distance curve', async t => {
  const { audio } = await audioFor(t, 3)
  audio.sync([], 'running')
  const { lightningStrike } = await import('/core3d/light.js')
  const scene = new Scene(), clock = new GameClock()
  scene.userData.audio = audio
  const scope = new ResourceScope({ clock })
  t.after(() => scope.dispose())
  lightningStrike(new AmbientLight(), scene, scope)
  assert.equal(audio.output.events.size, 0)
  clock.advance(10)
  assert.equal(audio.output.events.size, 1)
  const event = [...audio.output.events][0]
  assert.equal(event.spatialModel, null)
  assert.equal(event.profile.group, 'ambience')
  assert.equal(event.volume, 1)
})

test('a Vis enemy plane sounds its shot down only once', async t => {
  const { audio } = await audioFor(t)
  const { default: AttackPlane } = await import('/core/gameplay/bodies/aircraft/AttackPlane.js')
  const { default: AttackPlaneSprite } = await import('/core/actor/aircraft/AttackPlaneSprite.js')
  const { topProjection } = await import('/core/actor/projection.js')
  const body = new AttackPlane({ clock: new GameSession().clock })
  const view = new AttackPlaneSprite(body, { src: 'armies/nemci/avioni/bf-109-odozgo.png', projection: topProjection({ pxPerMeter: 10 }) })
  audio.sync([view], 'running')
  body.takeHit(1)
  view.update(0)
  body.takeHit(1)
  view.update(0)
  assert.equal(view.explosionSound.playback.voices.size, 1)
})

test('new object types register a new recording through the same contract without class-name handling', async t => {
  const { audio } = await audioFor(t, 3)
  const position = new Vector3(3, 0, 2)
  const source = new SoundSource('future-object.ogg', { profile: 'impact', spatial: { getPosition: () => position } })
  audio.sync([{ sounds: [source] }], 'running')
  const voice = source.play()
  await voice.started
  assert.equal(voice.profile.budgetKey, 'impact')
  assert.ok(voice.spatialModel)
  audio.end()
  assert.equal(voice.disposed, true)
})
