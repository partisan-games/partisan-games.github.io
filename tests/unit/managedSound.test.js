import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import SceneAudio from '/core/io/audio/SceneAudio.js'
import SoundSource from '/core/io/audio/SoundSource.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'
import { fixture } from './helpers/audioBackend.js'

let FieldGun, FieldGunSprite, CannonCrew, CannonCrewSprite, Skirmisher, SkirmisherSprite, sideProjection
let Wind, Airplane, GameObject2D, Ustanak, Tank, TankSprite, vehicleArt, ShellBody, ShellSprite
before(async() => {
  createPageElements()
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  ;[FieldGun, FieldGunSprite, CannonCrew, CannonCrewSprite, Skirmisher, SkirmisherSprite] = await Promise.all([
    import('/core/gameplay/bodies/artillery/FieldGun.js'), import('/core/actor/artillery/FieldGunSprite.js'),
    import('/core/gameplay/bodies/soldiers/CannonCrew.js'), import('/core/actor/soldiers/CannonCrewSprite.js'),
    import('/core/gameplay/bodies/soldiers/Skirmisher.js'), import('/core/actor/soldiers/SkirmisherSprite.js'),
  ]).then(modules => modules.map(module => module.default))
  ;[Wind, Airplane, GameObject2D, Ustanak, Tank, TankSprite, vehicleArt, ShellBody, ShellSprite] = await Promise.all([
    import('/scenes/ustanak/Wind.js'), import('/core/objects/Airplane.js'),
    import('/core/actor/GameObject2D.js'), import('/scenes/ustanak/Main.js'), import('/core/gameplay/bodies/vehicles/Tank.js'),
    import('/core/actor/vehicles/TankSprite.js'), import('/core/actor/vehicleArt.js'),
    import('/core/gameplay/bodies/projectiles/Shell.js'), import('/core/actor/projectiles/ShellSprite.js'),
  ]).then(modules => modules.map(module => module.default))
})

const settle = async() => {
  for (let i = 0; i < 24; i++) await Promise.resolve()
}
async function audioFor(t, options = {}) {
  const backend = fixture()
  await backend.engine.unlock()
  const listener = { position: { x: 0, y: 0 }, identity: 'player' }
  const audio = new SceneAudio({ engine: backend.engine, getListener: () => listener,
    coordinates: { dimensions: 2, unitsPerAudioUnit: 100 }, ...options })
  t.after(async() => {
    audio.end(); await backend.engine.dispose()
  })
  return { ...backend, audio, listener }
}

test('owner declarations allocate nothing before attachment and late pooled children keep their first shot', async t => {
  const { audio, context } = await audioFor(t)
  const source = new SoundSource('rifle.mp3', { profile: 'rifle', spatial: { position: { x: 10, y: 0 } } })
  assert.equal(source.play(), null)
  assert.equal(context.sources.length, 0)
  const owner = { sounds: [] }
  audio.sync([owner], 'running')
  const { default: BodySprite } = await import('/core/actor/BodySprite.js')
  // the view of a round made the first time it is seen, which fires its shot at once
  BodySprite.prototype.syncViews.call({ ...owner, children: [], audioScene: audio }, [{}], () => ({ sounds: [source] }))
  source.play()
  await settle()
  assert.equal(context.sources.length, 1)
  assert.equal(source.playback.audio.paused, false)
})

test('an emitted point stays frozen after its owner moves or leaves while its tail remains scene-owned', async t => {
  const { audio } = await audioFor(t)
  const owner = { position: { x: 100, y: 50 }, sounds: [] }
  const sound = new SoundSource('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => owner.position } })
  owner.sounds.push(sound)
  audio.sync([owner], 'running')
  const event = sound.play()
  await event.started
  const position = { ...event.spatialModel.position }
  owner.position.x = 500
  audio.sync([], 'running')
  audio.update(.1)
  assert.deepEqual(event.spatialModel.position, position)
  assert.equal(event.disposed, false)
  audio.end()
  assert.equal(event.disposed, true)
})

test('a loop intent set before attachment starts once and preserves its cursor through pause', async t => {
  const { audio, context } = await audioFor(t)
  const sound = new SoundSource('wind.mp3', { loop: true, profile: 'ambience' })
  sound.setPlaying(true)
  audio.sync([{ sounds: [sound] }], 'running')
  await settle()
  context.currentTime = 2
  audio.sync([{ sounds: [sound] }], 'paused')
  const cursor = sound.playback.audio.currentTime
  assert.equal(sound.playback.audio.paused, true)
  audio.sync([{ sounds: [sound] }], 'running')
  await settle()
  assert.equal(sound.playback.audio.currentTime, cursor)
  assert.equal(sound.playback.audio.paused, false)
})

test('a loop volume change reaches its playing voice without waiting for the next sync', async t => {
  const { audio } = await audioFor(t)
  const sound = new SoundSource('wind.mp3', { loop: true, profile: 'ambience' })
  audio.sync([{ sounds: [sound] }], 'running')
  sound.setPlaying(true)
  await settle()
  sound.volume = .25
  assert.equal(sound.playback.audio.volume, .25)
})

test('only explicitly allowed UI streams play before start and only result sources survive a finish', async t => {
  const { audio, stats } = await audioFor(t)
  const shot = new SoundSource('rifle.mp3', { profile: 'rifle' })
  const report = new SoundSource('typing.mp3', { stream: true, beforeStart: true, profile: 'ui' })
  const result = new SoundSource('fairy-arcade-sparkle.mp3', { afterFinish: true, profile: 'ui' })
  const root = { sounds: [shot, report, result] }
  audio.sync([root], 'ready')
  assert.equal(shot.play(), null)
  report.play()
  await settle()
  assert.equal(stats.media.length, 1)
  assert.equal(stats.media[0].volume, 1, 'master/source gain is not multiplied on the media element')
  audio.sync([root], 'running')
  const ordinary = shot.play(), ending = result.play()
  await Promise.all([ordinary.started, ending.started])
  audio.sync([root], 'finished')
  assert.equal(ordinary.disposed, true)
  assert.equal(ending.disposed, false)
  assert.equal(shot.play(), null)
})

test('the first report plays after cabinet activation even if the report joins before the audio is ready', async t => {
  const { default: Report } = await import('/ui/Report.js')
  const { engine, context, stats } = fixture()
  let resume
  t.mock.method(context, 'resume', () => new Promise(resolve => {
    resume = () => {
      context.state = 'running'
      resolve()
    }
  }))
  const activation = engine.unlock()
  const audio = new SceneAudio({ engine })
  const report = new Report({ container: document.createElement('div') })
  t.after(async() => {
    report.stop()
    audio.end()
    await engine.dispose()
  })
  audio.sync([report], 'ready')
  assert.equal(stats.media.length, 0)
  resume()
  await activation
  audio.sync([report], 'ready')
  await settle()
  assert.equal(stats.media.length, 1)
  assert.equal(stats.media[0].paused, false)
  report.stop()
  assert.equal(stats.media[0].paused, true)
})

test('a shell whistles in flight, bursts with one bang, and goes quiet out of play', async t => {
  const { audio } = await audioFor(t)
  const shell = new ShellBody({ gravity: 0 })
  const view = new ShellSprite(shell, sideProjection({ pxPerMeter: 22, groundY: 600 }))
  audio.sync([view], 'running')
  shell.launch({ x: 5, y: 5, z: 0 }, 0, 0, 20)
  view.update()
  await settle()
  assert.equal(view.flightSound.playback.audio.paused, false)
  shell.update(0)
  shell.strike({ target: { alive: true, takeHit() {} }, time: 0 })
  view.update()
  view.update()
  assert.equal(view.explosionSound.playback.voices.size, 1)
  shell.setState('idle')
  view.update()
  assert.equal(view.flightSound.playing, false)
})

test('a gun sounds only its real shots, its crew loads once, and the skirmisher fires at his interval', async t => {
  const { audio } = await audioFor(t)
  const views = { projection: sideProjection({ pxPerMeter: 10, groundY: 500 }) }
  const gun = new FieldGun({ x: 10 }), crew = new CannonCrew({ x: 5 }), rifle = new Skirmisher({ x: 20 })
  const gunView = new FieldGunSprite(gun, views), crewView = new CannonCrewSprite(crew, views)
  const rifleView = new SkirmisherSprite(rifle, views)
  rifle.setState('attack')
  audio.sync([gunView, crewView, rifleView], 'running')
  assert.equal(gun.launch(), true)
  assert.equal(gun.launch(), false)
  gunView.update(0)
  assert.equal(gunView.shotSound.playback.voices.size, 1)
  crew.setState('load')
  crewView.update(0)
  crewView.update(0)
  assert.equal(crewView.loadSound.playback.voices.size, 1)
  crew.setState('attack')
  crewView.update(0)
  assert.equal(crewView.loadSound.playing, false)
  rifle.update(2.9)
  rifleView.update(2.9)
  assert.equal(rifleView.shotSound.playback.voices.size, 0)
  rifle.update(.1)
  rifleView.update(.1)
  assert.equal(rifleView.shotSound.playback.voices.size, 1)
})

test('aircraft outside the image stay logical sources and wrap revisions reset their motion', async t => {
  const { audio } = await audioFor(t)
  const plane = new Airplane({ x: -200, y: 100, flammable: false })
  plane.width = 100; plane.height = 30
  audio.sync([plane], 'running')
  plane.update(0)
  assert.equal(plane.engineSound.desired, true)
  const revision = plane.audioRevision ?? 0
  plane.reset()
  assert.ok(plane.audioRevision > revision)
  plane.alive = false
  plane.update(0)
  assert.equal(plane.engineSound.desired, false)
  const wind = new Wind()
  const burning = new GameObject2D(null, { x: 20, y: 20, alive: false })
  assert.equal(wind.windSound.options.profile, 'ambience')
  assert.equal(burning.alive, false)
})

test('a tank sounds only its real shots, from its muzzle', async t => {
  const { audio } = await audioFor(t)
  const tank = new Tank({ clock: new GameClock(), x: 10, y: 1.45 })
  const view = new TankSprite(tank, { art: vehicleArt.partisanTank, barrel: { src: 'barrel.png' },
    projection: sideProjection({ pxPerMeter: 22, groundY: 600 }) })
  audio.sync([view], 'running')
  tank.shoot()
  tank.shoot()
  view.update(0)
  assert.equal(view.shotSound.playback.voices.size, 1)
  const { x, y } = view.shotPoint
  assert.deepEqual(view.shotSound.playback.audio.spatialModel.position, { x: x / 100, y: -y / 100, z: 0 })
})

test('Ustanak listener remains the left gun in 1P and switches only when flight settles in 2P', async t => {
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({}))
  const scene = new Ustanak()
  const previous = scene.sceneAudio
  const { audio } = await audioFor(t, { coordinates: previous.output.coordinates, getListener: previous.output.getListener })
  previous.end()
  scene.sceneAudio = audio
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const listener = () => audio.output.getListener().identity
  const [own, enemy] = scene.gunViews
  assert.equal(listener(), own)
  scene.turns.fire(0); scene.turns.settle(false)
  assert.equal(listener(), own, 'AI turn never changes the 1P listener')
  scene.vsComputer = false
  assert.equal(listener(), enemy)
  scene.turns.fire(1)
  assert.equal(scene.turns.settle(true), false)
  assert.equal(listener(), enemy)
  scene.turns.settle(false)
  assert.equal(listener(), own)
})

test('a living speaker follows its owner and ends on removal while ordinary shots retain their fixed origins', async t => {
  const { audio } = await audioFor(t)
  const owner = { position: { x: 100, y: 0 }, sounds: [] }
  const speech = new SoundSource('speech.ogg', { profile: 'speech', follow: true, spatial: { getPosition: () => owner.position } })
  owner.sounds.push(speech)
  audio.sync([owner], 'running')
  const voice = speech.play()
  await voice.started
  owner.position.x = 200
  audio.update(.1)
  assert.equal(voice.spatialState.distance, 2)
  audio.sync([], 'running')
  assert.equal(voice.disposed, true)
})

test('a loop declared while audio is locked creates no repeated handles and starts after activation', async t => {
  const { engine, context, stats } = fixture()
  const audio = new SceneAudio({ engine })
  t.after(async() => {
    audio.end(); await engine.dispose()
  })
  const sound = new SoundSource('locked-loop.ogg', { loop: true, profile: 'ambience' })
  const root = { sounds: [sound] }
  sound.play()
  for (let i = 0; i < 100; i++) audio.sync([root], 'running')
  assert.equal(audio.output.playbacks.size, 0)
  assert.equal(stats.contexts, 0)
  assert.equal(stats.fetches, 0)
  await audio.unlock()
  audio.sync([root], 'running')
  await sound.playback.audio.play()
  audio.sync([root], 'running')
  assert.equal(context.sources.length, 1)
  assert.equal(sound.desired, true)
  assert.equal(sound.playback.audio.paused, false)
})

test('a failed loop does not retry on every frame and the next explicit activation can recover', async t => {
  let fetches = 0
  const { engine } = fixture({ fetchFile: async() => {
    if (++fetches === 1) throw new Error('recording unavailable')
    return { ok: true, arrayBuffer: async() => new ArrayBuffer(1) }
  } })
  const audio = new SceneAudio({ engine })
  t.after(async() => {
    audio.end(); await engine.dispose()
  })
  await audio.unlock()
  const sound = new SoundSource('recover-loop.ogg', { loop: true, profile: 'ambience' })
  const root = { sounds: [sound] }
  audio.sync([root], 'running')
  sound.setPlaying(true)
  await assert.rejects(sound.playback.audio.play(), /recording unavailable/)
  for (let i = 0; i < 100; i++) {
    audio.sync([root], 'running')
    sound.setPlaying(true)
  }
  assert.equal(fetches, 1)
  await audio.unlock()
  audio.sync([root], 'running')
  await sound.playback.audio.play()
  assert.equal(fetches, 2)
  assert.equal(sound.playback.audio.paused, false)
})
