import { test } from 'node:test'
import assert from 'node:assert/strict'
import config from '/config.js'
import { AudioEngine } from '/core/io/audio/AudioEngine.js'
import SceneAudio from '/core/io/audio/SceneAudio.js'
import { audioGroups, mixHeadroom, resolveAudioProfile, screenMix, voiceLimits } from '/core/io/audio/audioProfiles.js'

import { decoded, deferred, fixture, finishFades, response, RecordingContext, RecordingMedia } from './helpers/audioBackend.js'

test('sources are lazy; only a gesture unlocks one shared application context', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('new-effect.ogg')
  await assert.rejects(source.play(), /gesture/)
  assert.equal(stats.contexts, 0)
  assert.equal(stats.fetches, 0)
  assert.equal(source.paused, true)
  await Promise.all([engine.unlock(), engine.unlock()])
  await source.play()
  assert.equal(stats.contexts, 1)
  assert.equal(context.resumes, 1)
  scene.dispose()
  assert.equal(context.state, 'running', 'leaving a scene keeps the application context')
  assert.ok(context.sources[0].stopped)
  await engine.dispose()
  assert.equal(context.state, 'closed')
})

test('concurrent and subsequent users share one fetch and decode of the same normalized asset URL', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const [first, second] = await Promise.all([engine.load('new-effect.ogg'), engine.load('/assets/sounds/new-effect.ogg')])
  assert.equal(first, second)
  assert.equal(await engine.load('new-effect.ogg'), first)
  assert.equal(stats.fetches, 1)
  assert.equal(context.decodes, 1)
})

test('a later gesture retries pending activation and releases existing playback waiters', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  const firstResume = deferred()
  context.resume = () => {
    context.resumes++
    if (context.resumes === 1) return firstResume.promise
    context.state = 'running'
    return Promise.resolve()
  }
  const first = engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('waiting.ogg')
  const playing = source.play()
  await engine.unlock()
  await first
  await playing
  assert.equal(context.resumes, 2)
  assert.equal(source.paused, false)
  firstResume.resolve()
})

test('one cancelled consumer does not abort another scene sharing the pending recording', async t => {
  const waiting = deferred(), began = deferred()
  let networkSignal
  const { engine, context, stats } = fixture({ fetchFile: (url, { signal }) => {
    networkSignal = signal
    began.resolve()
    return waiting.promise
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const controller = new AbortController()
  const first = engine.load('shared.ogg', { signal: controller.signal })
  const rejected = assert.rejects(first, { name: 'AbortError' })
  const second = engine.load('shared.ogg')
  await began.promise
  controller.abort()
  await rejected
  assert.equal(networkSignal.aborted, false)
  waiting.resolve(response())
  assert.equal((await second).duration, 10)
  assert.equal(stats.fetches, 1)
  assert.equal(context.decodes, 1)
})

test('ending the sole loading owner aborts its request and late data cannot play in the next scene', async t => {
  const waiting = deferred(), began = deferred()
  let networkSignal
  const { engine, context } = fixture({ fetchFile: (url, { signal }) => {
    networkSignal = signal
    began.resolve()
    return waiting.promise
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const old = engine.createSession()
  old.setState('running')
  const source = old.createPlayback('late.ogg')
  const rejected = assert.rejects(source.play(), { name: 'AbortError' })
  await began.promise
  old.dispose()
  await rejected
  assert.ok(networkSignal.aborted)
  waiting.resolve(response())
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(context.sources.length, 0)
  assert.equal(context.decodes, 0)
})

test('a response already decoding when its owner ends cannot start a late native source', async t => {
  const decoding = deferred(), began = deferred()
  const { engine, context } = fixture()
  context.decodeAudioData = () => {
    began.resolve()
    return decoding.promise
  }
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('late-decode.ogg')
  const rejected = assert.rejects(source.play(), { name: 'AbortError' })
  await began.promise
  scene.dispose()
  await rejected
  decoding.resolve(decoded(10))
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(context.sources.length, 0)
})

test('a failed fetch or decode is evicted so a future request can recover', async t => {
  let failFetch = true
  const { engine, context, stats } = fixture({ fetchFile: async() => {
    if (failFetch) {
      failFetch = false
      throw new Error('offline')
    }
    return response()
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  await assert.rejects(engine.load('retry.ogg'), /offline/)
  context.decodeAudioData = async() => {
    throw new Error('invalid recording')
  }
  await assert.rejects(engine.load('retry.ogg'), /invalid recording/)
  context.decodeAudioData = async() => decoded(7)
  assert.equal((await engine.load('retry.ogg')).duration, 7)
  assert.equal(stats.fetches, 3)
})

test('a buffered loop pauses at its cursor and a scene cannot resume it after disposal', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('loop.ogg', { loop: true })
  await source.play()
  context.currentTime = 2
  scene.setState('paused')
  assert.equal(source.currentTime, 2)
  assert.ok(context.sources[0].stopped)
  await assert.rejects(source.play(), { name: 'AbortError' })
  context.currentTime = 20
  scene.setState('running')
  await source.play()
  assert.equal(context.sources[1].offset, 2)
  scene.dispose()
  await assert.rejects(source.play(), { name: 'AbortError' })
})

test('natural completion releases a buffer source without treating manual pause as completion', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('shot.ogg')
  let ended = 0
  source.addEventListener('ended', () => ended++)
  await source.play()
  const node = context.sources[0]
  node.onended()
  assert.equal(node.connections.size, 0)
  assert.equal(ended, 1)
  await source.play()
  assert.equal(context.sources[1].offset, 0)
  source.pause()
  assert.equal(ended, 1)
})

test('streamed music uses the same scene/master path, preserves its cursor, and does not decode a full buffer', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const music = scene.createPlayback('long-track.ogg', { stream: true, loop: true })
  music.volume = .5
  await music.play()
  assert.equal(stats.fetches, 0)
  assert.equal(context.decodes, 0)
  assert.equal(stats.media[0].volume, 1, 'main volume belongs only to the master gain')
  assert.equal(stats.media[0].preservesPitch, true)
  assert.ok(music.node.connections.has(music.gain))
  assert.ok(music.gain.connections.has(scene.groups.get('music')))
  assert.ok(scene.groups.get('music').connections.has(scene.output))
  assert.ok(scene.output.connections.has(engine.mix))
  assert.ok(engine.mix.connections.has(engine.compressor))
  assert.ok(engine.compressor.connections.has(engine.master))
  assert.ok(engine.master.connections.has(context.destination))
  music.currentTime = 4
  scene.setState('paused')
  assert.ok(music.paused)
  scene.setState('running')
  await music.play()
  assert.equal(music.currentTime, 4)
  assert.equal(stats.media.length, 1)
  scene.dispose()
  assert.equal(stats.media[0].src, '')
  assert.equal(context.mediaSources[0].connections.size, 0)
})

test('a failed stream graph is discarded and retried without a standalone unmastered media element', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const makeSource = context.createMediaElementSource.bind(context)
  context.createMediaElementSource = () => {
    throw new Error('media graph failed')
  }
  const scene = engine.createSession()
  scene.setState('running')
  const music = scene.createPlayback('music.ogg', { stream: true })
  await assert.rejects(music.play(), /media graph failed/)
  assert.equal(music.media, null)
  assert.equal(stats.media[0].src, '')
  assert.ok(stats.media[0].paused)
  context.createMediaElementSource = makeSource
  await music.play()
  assert.equal(stats.media.length, 2)
  assert.ok(music.gain.connections.has(scene.groups.get('music')))
})

test('streaming recovers from a terminal resource error with a new mastered element and the saved cursor', async t => {
  const { engine, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const music = scene.createPlayback('retry-music.ogg', { stream: true })
  await music.play()
  const failed = music.media
  failed.currentTime = 3
  failed.play = async() => {
    failed.error = { code: 4 }
    throw new Error('failed resource')
  }
  failed.pause()
  await assert.rejects(music.play(), /failed resource/)
  await music.play()
  assert.equal(stats.media.length, 2)
  assert.notEqual(music.media, failed)
  assert.equal(failed.src, '')
  assert.equal(music.currentTime, 3)
  assert.ok(music.gain.connections.has(scene.groups.get('music')))
  assert.equal(music.paused, false)
})

test('a future emitter accepts arbitrary asset and profile data without another backend branch', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 10, y: 20, z: 30 }, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } }
  const coordinates = { dimensions: 3, unitsPerAudioUnit: 100, getWorldOffset: () => ({ x: 500, y: 0, z: 0 }) }
  const scene = engine.createSession({ getListener: () => player, coordinates })
  const unknownObject = { position: { x: 50, y: 20, z: 30 } }
  const spatial = { getPosition: () => unknownObject.position }
  const profile = { nearDistance: 2, fadeStart: 20, maxDistance: 30 }
  const source = scene.createPlayback('future-object.ogg', { spatial, profile })
  assert.equal(scene.getListener(), player)
  assert.equal(scene.coordinates, coordinates)
  assert.equal(source.spatial, spatial)
  assert.deepEqual(source.profile, resolveAudioProfile(profile))
  scene.setState('running')
  await source.play()
  assert.equal(source.paused, false)
  const withoutPlayer = engine.createSession()
  assert.throws(() => withoutPlayer.createPlayback('future-object.ogg', { spatial }), /listener/)
})

test('SceneAudio opt-in applies master volume once and ending an old scene leaves the next one playing', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  const old = new SceneAudio({ engine })
  const next = new SceneAudio({ engine })
  const sound = old.createSound('shared.ogg', { volume: .5, loop: true })
  const other = next.createSound('shared.ogg', { loop: true })
  await old.unlock()
  old.sync([{ sounds: [sound] }], 'running')
  next.sync([{ sounds: [other] }], 'running')
  sound.setPlaying(true)
  other.setPlaying(true)
  await Promise.all([sound.audio.play(), other.audio.play()])
  assert.equal(sound.audio.volume, .5)
  assert.equal(engine.master.gain.value, config.volume)
  old.end()
  assert.ok(sound.audio.disposed)
  assert.equal(other.audio.paused, false)
  assert.equal(context.state, 'running')
  next.end()
})

test('session spatial updates share a world snapshot and freeze their output transition through pause', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const first = { position: { x: 0, y: 0 } }, second = { position: { x: 400, y: 0 } }
  let player = first, reads = 0
  const coordinates = { dimensions: 2, unitsPerAudioUnit: 100, getWorldOffset: () => { reads++; return { x: 0, y: 0 } } }
  const scene = engine.createSession({ getListener: () => player, coordinates })
  const profile = { nearDistance: 1, fadeStart: 8, maxDistance: 10 }
  const source = scene.createPlayback('spatial.ogg', { spatial: { position: { x: 100, y: 0 } }, profile })
  const other = scene.createPlayback('spatial.ogg', { spatial: { getPosition: () => ({ x: 100, y: 0 }) }, profile })
  scene.setState('running')
  await Promise.all([source.play(), other.play()])
  const before = reads
  scene.updateSpatial(0)
  assert.equal(reads, before + 1, 'both sources use the same coordinate snapshot')
  assert.equal(source.spatialState.distance, 1)
  player = second
  scene.updateSpatial(.25)
  assert.equal(source.spatialState.listenerPosition.x, 4, 'listener jumps to the exact new player')
  assert.equal(source.spatialState.pan, 0, 'only the output is halfway through its transition')
  const frozen = source.spatialState
  scene.setState('paused')
  scene.updateSpatial(20)
  assert.equal(source.spatialState, frozen)
  scene.setState('running')
  await source.play()
  scene.updateSpatial(.25)
  assert.equal(source.spatialState.pan, -1)
  assert.equal(source.spatialState.gain, 1 / 3)
  assert.throws(() => scene.setSpatialContext({ coordinates: { dimensions: 3, unitsPerAudioUnit: 1 } }), /coordinate frame/)
  assert.throws(() => scene.setSpatialContext({ getListener: null }), /listener/)
  scene.setSpatialContext({ getListener: () => null })
  assert.throws(() => scene.updateSpatial(.01), /actual player/)
  scene.dispose()
  scene.updateSpatial(1)
})

test('spatial registrations reject missing coordinates and invalid distance profiles before creating playback handles', t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  const scene = engine.createSession({ getListener: () => ({ position: { x: 0, y: 0 } }) })
  const spatial = { position: { x: 0, y: 0 } }
  assert.throws(() => scene.createPlayback('bad.ogg', { spatial }), /coordinate frame/)
  scene.setSpatialContext({ coordinates: { dimensions: 2, unitsPerAudioUnit: 100 } })
  assert.throws(() => scene.createPlayback('bad.ogg', { spatial, profile: { nearDistance: 0 } }), /distances/)
  assert.equal(scene.playbacks.size, 0)
})

test('one emitter creates overlapping shots at independent frozen world points and releases each finished voice', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }, position = { x: 100, y: 0 }
  const scene = new SceneAudio({ engine, getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 100 } })
  const sound = scene.createSound('shot.ogg', { volume: .25, spatial: { getPosition: () => position }, profile: { nearDistance: 1, fadeStart: 8, maxDistance: 10 } })
  const owner = { sounds: [sound] }
  scene.sync([owner], 'running')
  const first = sound.play()
  position.x = 400
  sound.volume = .75
  const second = sound.play()
  await Promise.all([first.started, second.started])
  scene.update(0)
  assert.equal(context.sources.length, 2)
  assert.equal(first.volume, .25)
  assert.equal(second.volume, .75)
  assert.equal(first.spatialState.sourcePosition.x, 1)
  assert.equal(second.spatialState.sourcePosition.x, 4)
  position.x = 900
  scene.sync([], 'running')
  scene.update(.01)
  assert.equal(first.paused, false, 'removing the owner leaves its emitted tail playing')
  assert.equal(first.spatialState.sourcePosition.x, 1, 'pool reuse cannot move an emitted shot')
  assert.equal(second.spatialState.sourcePosition.x, 4)
  assert.equal(sound.voices.size, 0, 'detached events no longer retain their emitter callbacks')
  context.sources[0].onended()
  assert.ok(first.disposed)
  assert.equal(first.gain, null)
  assert.equal(scene.output.playbacks.has(first), false)
  assert.equal(second.paused, false)
  context.sources[1].onended()
  assert.equal(scene.output.playbacks.size, 0)
  assert.equal(scene.output.events.size, 0)
  scene.end()
})

test('an owner loop keeps its native source across repeated true updates, resumes its cursor and stops on removal', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const position = { x: 100, y: 0 }
  const scene = new SceneAudio({ engine, getListener: () => ({ identity: 'player', position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 100 } })
  const loop = scene.createSound('engine.ogg', { loop: true, spatial: { getPosition: () => position }, profile: { nearDistance: 1, fadeStart: 8, maxDistance: 10 } })
  const roots = [{ sounds: [loop] }]
  scene.sync(roots, 'running')
  loop.setPlaying(true)
  await loop.audio.play()
  const original = context.sources[0]
  scene.update(0)
  assert.equal(loop.audio.spatialState.sourcePosition.x, 1)
  position.x = 400
  loop.volume = .5
  scene.sync(roots, 'running')
  scene.update(.01)
  for (let i = 0; i < 100; i++) loop.setPlaying(true)
  assert.equal(context.sources.length, 1)
  assert.equal(loop.audio.node, original)
  assert.equal(loop.audio.spatialState.sourcePosition.x, 4)
  assert.equal(loop.audio.volume, .5)
  context.currentTime = 3
  scene.sync(roots, 'paused')
  context.currentTime = 50
  scene.sync(roots, 'running')
  await loop.audio.play()
  assert.equal(context.sources[1].offset, 3)
  scene.sync([], 'running')
  assert.ok(loop.audio.disposed)
  assert.ok(context.sources[1].stopped)
  assert.equal(scene.output.playbacks.size, 0)
  assert.equal(scene.output.emitters.size, 0)
  scene.sync(roots, 'running')
  loop.setPlaying(true)
  await loop.audio.play()
  assert.equal(context.sources[2].offset, 0, 'reattaching a pooled owner creates a fresh loop')
  scene.end()
})

test('detached event tails pause and resume under their scene without their old owner', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = new SceneAudio({ engine })
  const sound = scene.createSound('tail.ogg')
  scene.sync([{ sounds: [sound] }], 'running')
  const voice = sound.play()
  await voice.started
  context.currentTime = 2
  scene.sync([], 'running')
  scene.sync([], 'paused')
  assert.equal(voice.currentTime, 2)
  context.currentTime = 20
  scene.sync([], 'running')
  await voice.play()
  assert.equal(context.sources[1].offset, 2)
  assert.equal(voice.paused, false)
  scene.end()
  assert.ok(voice.disposed)
})

test('late one-shot loading expires during updates and aborts its sole request', async t => {
  const waiting = deferred(), began = deferred()
  let signal
  const { engine, context } = fixture({ fetchFile: (url, options) => {
    signal = options.signal
    began.resolve()
    return waiting.promise
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const voice = scene.emit('late-event.ogg', { maxDelay: .1 })
  const rejected = assert.rejects(voice.started, { name: 'AbortError' })
  await began.promise
  context.currentTime = .11
  scene.update(.11)
  await rejected
  assert.ok(signal.aborted)
  assert.ok(voice.disposed)
  waiting.resolve(response())
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(context.sources.length, 0)
})

test('an event cannot start after its native audio deadline even if no scene update happened during loading', async t => {
  const waiting = deferred(), began = deferred()
  const { engine, context } = fixture({ fetchFile: () => {
    began.resolve()
    return waiting.promise
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const voice = scene.emit('stalled-event.ogg', { maxDelay: .1 })
  const rejected = assert.rejects(voice.started, { name: 'AbortError' })
  await began.promise
  context.currentTime = .11
  waiting.resolve(response())
  await rejected
  assert.ok(voice.disposed)
  assert.equal(context.sources.length, 0)
  assert.equal(scene.events.size, 0)
})

test('pause drops a still-loading event instead of replaying stale shots after resume', async t => {
  const waiting = deferred(), began = deferred()
  const { engine, context } = fixture({ fetchFile: () => {
    began.resolve()
    return waiting.promise
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const voice = scene.emit('paused-event.ogg')
  const rejected = assert.rejects(voice.started, { name: 'AbortError' })
  await began.promise
  scene.setState('paused')
  await rejected
  assert.equal(scene.emit('another-event.ogg'), null)
  scene.setState('running')
  waiting.resolve(response())
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(context.sources.length, 0)
  assert.equal(scene.pausedEvents.size, 0)
})

test('stopping an emitter cancels its overlapping voices and ending an old scene leaves the next scene intact', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const old = new SceneAudio({ engine }), next = new SceneAudio({ engine })
  const sound = old.createSound('shared-event.ogg'), other = next.createSound('shared-event.ogg')
  old.sync([{ sounds: [sound] }], 'running')
  next.sync([{ sounds: [other] }], 'running')
  const first = sound.play(), second = sound.play(), third = other.play()
  await Promise.all([first.started, second.started, third.started])
  sound.stop()
  assert.ok(first.disposed && second.disposed)
  assert.equal(third.paused, false)
  old.end()
  assert.equal(third.paused, false)
  assert.equal(context.state, 'running')
  next.end()
  assert.ok(third.disposed)
})

test('rapid pause/resume cannot let a stale resume rejection dispose the current event tail', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const voice = scene.emit('resume-tail.ogg')
  await voice.started
  context.currentTime = 1
  scene.setState('paused')
  scene.setState('running')
  scene.setState('paused')
  scene.setState('running')
  await voice.play()
  assert.equal(voice.disposed, false)
  assert.equal(voice.paused, false)
  assert.equal(context.sources.at(-1).offset, 1)
})

test('locked audio cannot accumulate event shots and preceding simulation time cannot age a fresh emission', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  const scene = engine.createSession()
  scene.setState('running')
  assert.equal(scene.emit('locked.ogg'), null)
  assert.equal(scene.events.size, 0)
  await engine.unlock()
  const voice = scene.emit('fresh.ogg')
  scene.update(2)
  await voice.started
  assert.equal(voice.disposed, false, 'time before the current emission is not loading delay')
  context.state = 'suspended'
  assert.equal(scene.emit('suspended.ogg'), null)
})

test('an event load failure releases its emitter bookkeeping and the next emission can recover', async t => {
  let fail = true
  const { engine } = fixture({ fetchFile: async() => {
    if (fail) {
      fail = false
      throw new Error('offline')
    }
    return response()
  } })
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = new SceneAudio({ engine })
  const sound = scene.createSound('recover-shot.ogg')
  scene.sync([{ sounds: [sound] }], 'running')
  const failed = sound.play()
  await assert.rejects(failed.started, /offline/)
  assert.ok(failed.disposed)
  assert.equal(sound.playing, false)
  assert.equal(sound.voices.size, 0)
  const next = sound.play()
  await next.started
  assert.equal(next.paused, false)
  scene.end()
})

test('a completed match stops regular tails and permits only explicitly declared after-finish events', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const regular = scene.emit('regular.ogg')
  await regular.started
  scene.setState('finished')
  assert.ok(regular.disposed)
  assert.equal(scene.emit('too-late.ogg'), null)
  const closing = scene.emit('closing.ogg', { afterFinish: true })
  await closing.started
  assert.equal(closing.paused, false)
  scene.dispose()
  assert.ok(closing.disposed)
})

test('spatial processing is correct before the first sample and routes through group, headroom and one master gain', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }, position = { x: 10, y: 0 }
  const scene = engine.createSession({ getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const profile = { ...resolveAudioProfile('engine'), trim: .5 }
  const source = scene.createPlayback('moving-engine.ogg', { loop: true, profile, spatial: { getPosition: () => position } })
  source.volume = .4
  await source.play()
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10)
  close(source.gain.gain.value, .4 * .5 * .2)
  assert.equal(source.processing.panner.pan.value, 1)
  const linearQ = 10 ** (source.processing.filter.Q.value / 20)
  assert.ok(linearQ > .7 && linearQ < .708, 'low-pass resonance is configured in decibels')
  assert.ok(source.gain.connections.has(source.processing.filter))
  assert.ok(source.processing.filter.connections.has(source.processing.panner))
  assert.ok(source.processing.panner.connections.has(scene.groups.get('engines')))
  assert.equal(scene.groups.get('engines').gain.value, audioGroups.engines)
  assert.equal(engine.mix.gain.value, mixHeadroom)
  assert.equal(engine.master.gain.value, config.volume)
  const initialCutoff = source.processing.filter.frequency.value
  context.currentTime = 1
  position.x = 5
  scene.update(1)
  assert.ok(source.processing.filter.frequency.value > initialCutoff)
  assert.ok(source.dopplerRate > 1 && source.dopplerRate <= 1.1)
  const factor = source.dopplerRate
  context.currentTime = 2
  close(source.currentTime, 1 + factor)
  scene.setGroupVolume('engines', .2)
  assert.equal(scene.groups.get('engines').gain.value, .2)
  close(source.gain.gain.value, .4 * .5 * source.spatialState.gain)
  assert.ok(source.gain.gain.targets.length > 0, 'live changes use AudioParam automation')
  scene.setState('paused')
  const cursor = source.currentTime
  assert.equal(source.processing, null)
  context.currentTime = 20
  scene.update(10)
  assert.equal(source.processing, null)
  scene.setGroupVolume('engines', audioGroups.engines)
  scene.setState('running')
  await source.play()
  close(context.sources[1].offset, cursor)
  assert.equal(context.sources[1].playbackRate.value, 1, 'resume resets physical velocity history')
  const processing = source.processing
  source.dispose()
  assert.equal(processing.filter.connections.size, 0)
  assert.equal(processing.panner.connections.size, 0)
})

test('profile variants change only the audio stream and preserve source volume and trim as separate factors', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  engine.random = () => .75
  await engine.unlock()
  const scene = new SceneAudio({ engine })
  const sound = scene.createSound('base.ogg', { variants: ['alternative.ogg'], volume: .4, profile: { trim: .5, pitchRange: [.98, 1.02], volumeRange: [.9, 1] } })
  scene.sync([{ sounds: [sound] }], 'running')
  const voice = sound.play()
  await voice.started
  assert.ok(voice.file.endsWith('/alternative.ogg'))
  assert.ok(Math.abs(voice.playbackRate - 1.01) < 1e-10)
  assert.ok(Math.abs(voice.variationVolume - .975) < 1e-10)
  assert.ok(Math.abs(voice.gain.gain.value - .4 * .5 * .975) < 1e-10)
  assert.equal(voice.volume, .4)
  scene.end()
})

test('a partial spatial graph is disconnected and a new loop can retry using the decoded cache', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = new SceneAudio({ engine, getListener: () => ({ identity: 'player', position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  const sound = scene.createSound('graph-retry.ogg', { loop: true, profile: 'engine', spatial: { position: { x: 2, y: 0 } } })
  scene.sync([{ sounds: [sound] }], 'running')
  const makePanner = context.createStereoPanner.bind(context), makeFilter = context.createBiquadFilter.bind(context)
  let partial
  context.createBiquadFilter = () => {
    partial = makeFilter()
    return partial
  }
  context.createStereoPanner = () => { throw new Error('panner failed') }
  sound.setPlaying(true)
  await assert.rejects(sound.audio.play(), /panner failed/)
  assert.equal(partial.connections.size, 0)
  assert.ok(sound.audio.disposed)
  context.createStereoPanner = makePanner
  await scene.unlock()
  sound.setPlaying(true)
  await sound.audio.play()
  assert.equal(sound.audio.paused, false)
  assert.equal(stats.fetches, 1)
  scene.end()
})

test('failed application mix creation closes the partial context and a later gesture can retry cleanly', async t => {
  const first = new RecordingContext(), second = new RecordingContext()
  first.createDynamicsCompressor = () => { throw new Error('mix failed') }
  let count = 0
  const engine = new AudioEngine({ createContext: () => count++ ? second : first })
  t.after(() => engine.dispose())
  await assert.rejects(engine.unlock(), /mix failed/)
  assert.equal(first.state, 'closed')
  assert.equal(engine.context, null)
  await engine.unlock()
  assert.equal(engine.context, second)
  assert.equal(second.state, 'running')
})

test('a streamed moving source disables pitch preservation for Doppler and resets it after pause', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }, position = { x: 10, y: 0 }
  const scene = engine.createSession({ getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const source = scene.createPlayback('stream-engine.ogg', { stream: true, loop: true, profile: 'engine', spatial: { getPosition: () => position } })
  await source.play()
  assert.equal(source.media.preservesPitch, false)
  position.x = 5
  scene.update(1)
  assert.ok(source.media.playbackRate > 1 && source.media.playbackRate <= 1.1)
  scene.setState('paused')
  scene.setState('running')
  await source.play()
  assert.equal(source.media.playbackRate, 1)
})

test('burst admission is bounded globally, reserves critical slots and includes fading victims in the native cap', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession(), other = engine.createSession()
  scene.setState('running')
  other.setState('running')
  const accepted = []
  for (let i = 0; i < 1000; i++) {
    const voice = (i % 2 ? scene : other).emit('burst.ogg')
    if (voice) accepted.push(voice)
  }
  assert.equal(accepted.length, voiceLimits.total - voiceLimits.reserved)
  assert.equal(engine.budget.active.size, 14)
  assert.equal(scene.events.size + other.events.size, 14, 'rejected bursts do not retain event objects')
  await Promise.all(accepted.map(voice => voice.started))
  const first = scene.emit('burst.ogg', { profile: 'ui' }), second = other.emit('burst.ogg', { profile: 'ui' })
  await Promise.all([first.started, second.started])
  const third = scene.emit('burst.ogg', { profile: 'ui' })
  assert.equal(engine.budget.active.size, 16)
  assert.equal(engine.budget.waiting.size, 1)
  assert.equal(context.sources.filter(node => node.connections.size).length, 16, 'fading nodes still occupy their slots')
  context.currentTime = .02
  finishFades(context)
  await third.started
  assert.equal(context.sources.filter(node => node.connections.size).length, 16)
  assert.equal(engine.budget.active.size, 16)
  assert.equal(engine.budget.waiting.size, 0)
  assert.equal(stats.fetches, 1)
  scene.dispose()
  other.dispose()
  assert.equal(engine.budget.active.size, 0)
})

test('virtual loops have no active graph, retain rate-adjusted phase through pause and reuse their decoded buffer', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const position = { x: 1, y: 0 }, player = { position: { x: 0, y: 0 } }
  const scene = engine.createSession({ getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const source = scene.createPlayback('virtual-engine.ogg', { loop: true, profile: 'engine', spatial: { getPosition: () => position } })
  await source.play()
  const buffer = source.buffer
  context.currentTime = 2
  position.x = 1000
  scene.update(0)
  assert.equal(source.virtual, true)
  context.currentTime = 2.02
  finishFades(context)
  assert.equal(source.node, null)
  assert.equal(source.processing, null)
  assert.equal(engine.budget.active.size, 0)
  scene.update(25)
  assert.ok(Math.abs(source.currentTime - 7) < 1e-10)
  source.playbackRate = 1.1
  scene.update(20)
  assert.ok(Math.abs(source.currentTime - 9) < 1e-10)
  scene.setState('paused')
  scene.update(100)
  assert.ok(Math.abs(source.currentTime - 9) < 1e-10)
  position.x = 1
  scene.setState('running')
  await source.play()
  assert.equal(source.virtual, false)
  assert.ok(Math.abs(context.sources.at(-1).offset - 9) < 1e-10)
  assert.equal(source.buffer, buffer)
  assert.equal(stats.fetches, 1)
  source.dispose()
  assert.equal(engine.budget.active.size, 0)
})

test('a loop born outside range creates no native source or fetch until it approaches, then starts at its logical phase', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const position = { x: 1000, y: 0 }
  const scene = engine.createSession({ getListener: () => ({ identity: 'player', position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const source = scene.createPlayback('initially-far.ogg', { loop: true, profile: 'engine', spatial: { getPosition: () => position } })
  await source.play()
  scene.update(27)
  assert.equal(source.virtual, true)
  assert.equal(context.sources.length, 0)
  assert.equal(stats.fetches, 0)
  position.x = 1
  scene.update(0)
  await source.play()
  assert.equal(context.sources[0].offset, 7)
  assert.equal(stats.fetches, 1)
})

test('the loop cap chooses nearer sources and a displaced loop stays virtual without restart churn', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession({ getListener: () => ({ identity: 'player', position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const sources = []
  for (const x of [2, 3, 4, 5]) {
    const source = scene.createPlayback('limited-loop.ogg', { loop: true, profile: 'engine', spatial: { position: { x, y: 0 } } })
    await source.play()
    sources.push(source)
  }
  const near = scene.createPlayback('limited-loop.ogg', { loop: true, profile: 'engine', spatial: { position: { x: 1, y: 0 } } })
  const started = near.play()
  assert.equal(engine.budget.active.size, 4)
  assert.equal(sources[3].retiring, true)
  context.currentTime = .02
  finishFades(context)
  await started
  for (let i = 0; i < 10; i++) scene.update(1 / 60)
  assert.equal(engine.budget.active.size, 4)
  assert.equal(sources[3].virtual, true)
  assert.equal(sources[3].node, null)
  assert.equal(context.sources.length, 5)
})

test('streamed virtual loops disconnect processing, preserve metadata and resume without another media resource', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('virtual-music.ogg', { stream: true, loop: true })
  await source.play()
  const media = source.media
  media.currentTime = 3
  source.volume = 0
  scene.update(0)
  context.currentTime = .02
  scene.update(0)
  assert.equal(source.virtual, true)
  assert.equal(source.node.connections.size, 0)
  assert.equal(source.processing, null)
  assert.equal(engine.budget.active.size, 0)
  scene.update(25)
  source.volume = 1
  scene.update(0)
  await source.play()
  assert.equal(source.media, media)
  assert.equal(source.media.currentTime, 8)
  assert.equal(stats.media.length, 1)
  assert.equal(engine.budget.active.size, 1)
})

test('a recording too quiet at the speaker never gets a native source, while a loud one plays', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  context.decodeAudioData = async() => decoded(10, .001)
  const quiet = scene.createPlayback('quiet-loop.ogg', { loop: true })
  await quiet.play()
  assert.equal(quiet.virtual, true)
  assert.equal(context.sources.length, 0)
  assert.equal(engine.budget.active.size, 0)
  const shot = scene.emit('quiet-shot.ogg')
  await shot.started.catch(() => {})
  assert.equal(shot.disposed, true)
  assert.equal(context.sources.length, 0)
  context.decodeAudioData = async() => decoded(10, .3)
  const loud = scene.createPlayback('loud-loop.ogg', { loop: true })
  await loud.play()
  assert.equal(loud.virtual, false)
  assert.equal(context.sources.length, 1)
})

test('every 2D source on screen is raised into the audible range and a source off screen is not played', async t => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }
  const scene = engine.createSession({ getListener: () => player, coordinates: {
    dimensions: 2, unitsPerAudioUnit: 100, getViewport: () => ({ min: { x: 0, y: 0 }, max: { x: 1920, y: 1080 } }),
  } })
  scene.setState('running')
  context.decodeAudioData = async() => decoded(10, .01)
  const far = scene.createPlayback('quiet-engine.ogg', { loop: true, profile: 'engine', spatial: { position: { x: 1920, y: 1080 } } })
  far.volume = .2
  await far.play()
  assert.equal(far.virtual, false, 'a quiet engine in the far screen corner still plays')
  assert.ok(engine.budget.audibility(far) > voiceLimits.enter)
  const near = engine.budget.audibility(far) / far.spatialState.gain
  close(20 * Math.log10(near), 20 * Math.log10(screenMix.nearLevel))
  close(far.gain.gain.value, .2 * far.spatialState.gain * engine.budget.makeup(far))
  const outside = scene.createPlayback('quiet-engine.ogg', { loop: true, profile: 'engine', spatial: { position: { x: 4000, y: 500 } } })
  await outside.play()
  assert.equal(outside.virtual, true, 'off screen is not heard')
})

test('a steady quiet sound beside the player is raised only to the audibility floor, not to the on-screen near level', async t => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }
  const scene = engine.createSession({ getListener: () => player, coordinates: {
    dimensions: 2, unitsPerAudioUnit: 100, getViewport: () => ({ min: { x: 0, y: 0 }, max: { x: 1920, y: 1080 } }),
  } })
  scene.setState('running')
  context.decodeAudioData = async() => decoded(10, .01)
  const hum = scene.createPlayback('hum.ogg', { loop: true, steady: true, profile: 'engine', spatial: { getPosition: () => player.position } })
  const plane = scene.createPlayback('plane.ogg', { loop: true, profile: 'engine', spatial: { getPosition: () => player.position } })
  hum.volume = plane.volume = .2
  await Promise.all([hum.play(), plane.play()])
  close(engine.budget.audibility(hum), screenMix.floorLevel)
  close(engine.budget.audibility(plane), screenMix.nearLevel)
})

test('a mix offset lowers a raised on-screen sound by its decibels but never below the audibility floor', async t => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { position: { x: 0, y: 0 } }
  const scene = engine.createSession({ getListener: () => player, coordinates: {
    dimensions: 2, unitsPerAudioUnit: 100, getViewport: () => ({ min: { x: 0, y: 0 }, max: { x: 1920, y: 1080 } }),
  } })
  scene.setState('running')
  context.decodeAudioData = async() => decoded(10, .01)
  const spatial = { getPosition: () => player.position }
  const softer = scene.createPlayback('wake.ogg', { loop: true, mixOffset: -2, profile: 'water', spatial })
  const silenced = scene.createPlayback('wake.ogg', { loop: true, mixOffset: -40, profile: 'water', spatial })
  softer.volume = silenced.volume = .2
  await Promise.all([softer.play(), silenced.play()])
  close(engine.budget.audibility(softer), screenMix.nearLevel * 10 ** (-2 / 20))
  close(engine.budget.audibility(silenced), screenMix.floorLevel)
})

test('a shared ambient area uses one loop, survives one owner removal and preserves phase through pause', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = new SceneAudio({ engine, getListener: () => ({ identity: 'player', position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  const spatial = { getArea: () => ({ min: { x: 1, y: 0 }, max: { x: 3, y: 2 } }) }
  const options = { ambienceKey: 'one-fire', loop: true, profile: 'fire', spatial }
  const first = scene.createSound('shared-fire.ogg', { ...options, volume: .4 }), second = scene.createSound('shared-fire.ogg', { ...options, volume: .7 })
  const roots = [{ sounds: [first] }, { sounds: [second] }]
  scene.sync(roots, 'running')
  first.setPlaying(true)
  second.setPlaying(true)
  await first.audio.play()
  assert.equal(first.audio, second.audio)
  assert.equal(context.sources.length, 1)
  assert.equal(first.audio.volume, .7)
  context.currentTime = 2
  scene.sync(roots, 'paused')
  context.currentTime = 20
  scene.sync(roots, 'running')
  await first.audio.play()
  assert.equal(context.sources.at(-1).offset, 2)
  scene.sync([roots[1]], 'running')
  assert.equal(second.audio.paused, false)
  const wrongArea = scene.createSound('shared-fire.ogg', { ...options, spatial: { getArea: spatial.getArea } })
  assert.throws(() => scene.sync([roots[1], { sounds: [wrongArea] }], 'running'), /physical area/)
  scene.sync([], 'running')
  assert.equal(scene.output.ambiences.size, 0)
  assert.equal(engine.budget.active.size, 0)
  scene.end()
})

test('distant ambient automation is throttled while exact positions and urgent listener changes remain current', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const player = { identity: 'first', position: { x: 0, y: 0 } }, position = { x: 20, y: 0 }
  const scene = engine.createSession({ getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  scene.setState('running')
  const source = scene.createPlayback('distant-fire.ogg', { loop: true, profile: 'fire', spatial: { getPosition: () => position } })
  await source.play()
  const frequency = source.processing.filter.frequency
  const initial = frequency.targets.length
  for (let i = 0; i < 5; i++) {
    position.x += .01
    scene.update(.01)
    assert.equal(source.spatialState.sourcePosition.x, position.x)
  }
  assert.equal(frequency.targets.length, initial)
  scene.update(.06)
  assert.ok(frequency.targets.length > initial)
  const beforeSwitch = frequency.targets.length
  player.identity = 'second'
  player.position.x = 1
  scene.update(.01)
  assert.equal(source.spatialState.listenerPosition.x, 1)
  assert.ok(frequency.targets.length > beforeSwitch)
})

test('a fading slot reservation expires rather than starting a stale critical event, and disposal drains all bookkeeping', async t => {
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const scene = engine.createSession()
  scene.setState('running')
  const voices = []
  for (let i = 0; i < 16; i++) {
    const voice = scene.emit('slots.ogg', i < 14 ? {} : { profile: 'ui' })
    voices.push(voice)
  }
  await Promise.all(voices.map(voice => voice.started))
  const late = scene.emit('slots.ogg', { profile: 'ui', maxDelay: .05 })
  const rejected = assert.rejects(late.started, { name: 'AbortError' })
  context.currentTime = .1
  scene.update(0)
  finishFades(context)
  await rejected
  assert.equal(context.sources.length, 16)
  assert.equal(engine.budget.waiting.size, 0)
  scene.dispose()
  assert.equal(engine.budget.active.size, 0)
  assert.equal(scene.playbacks.size, 0)
  assert.equal(scene.emitters.size, 0)
})

test('per-profile caps are shared across scenes and cannot be bypassed by another emitter', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  engine.random = () => .5
  await engine.unlock()
  const first = engine.createSession(), second = engine.createSession()
  first.setState('running')
  second.setState('running')
  const shots = []
  for (let i = 0; i < 100; i++) {
    const voice = (i % 2 ? first : second).emit('rifle.ogg', { profile: 'rifle' })
    if (voice) shots.push(voice)
  }
  await Promise.all(shots.map(voice => voice.started))
  assert.equal(shots.length, resolveAudioProfile('rifle').maxVoices)
  assert.ok(engine.budget.active.size < voiceLimits.total)
  assert.throws(() => first.createPlayback('bad-policy.ogg', { profile: { ...resolveAudioProfile('rifle'), maxVoices: 1 } }), /consistent cap/)
})

test('ending a scene during streamed metadata loading cancels listeners and frees the reserved slot', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const began = deferred()
  engine.createMedia = url => {
    const media = new RecordingMedia(url)
    media.readyState = 0
    media.load = () => began.resolve()
    stats.media.push(media)
    return media
  }
  const scene = engine.createSession()
  scene.setState('running')
  const voice = scene.createPlayback('metadata.ogg', { stream: true, loop: true })
  const rejected = assert.rejects(voice.play(), { name: 'AbortError' })
  await began.promise
  scene.dispose()
  await rejected
  assert.equal(engine.budget.active.size, 0)
  assert.equal(context.mediaSources.length, 0)
  assert.equal(stats.media[0].src, '')
})

test('repeated isolated sessions leave no native reservations or scene resources and retain just the shared clip', async t => {
  const { engine, context, stats } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  for (let round = 0; round < 20; round++) {
    const scene = engine.createSession()
    scene.setState('running')
    const loop = scene.createPlayback('replay.ogg', { loop: true })
    await loop.play()
    scene.dispose()
    assert.equal(scene.playbacks.size, 0)
    assert.equal(scene.emitters.size, 0)
    assert.equal(scene.ambiences.size, 0)
    assert.equal(engine.sessions.size, 0)
    assert.equal(engine.budget.active.size, 0)
    assert.equal(engine.budget.waiting.size, 0)
  }
  assert.equal(context.sources.filter(node => node.connections.size).length, 0)
  assert.equal(engine.buffers.size, 1)
  assert.equal(stats.fetches, 1)
})

test('ending a scene while context activation is pending cancels playback without waiting for another gesture', async t => {
  const activation = deferred(), began = deferred()
  const { engine, context } = fixture()
  t.after(() => engine.dispose())
  context.resume = () => {
    began.resolve()
    return activation.promise
  }
  const unlocking = engine.unlock()
  const unlockRejected = assert.rejects(unlocking, { name: 'AbortError' })
  await began.promise
  const scene = engine.createSession()
  scene.setState('running')
  const source = scene.createPlayback('waiting.ogg')
  const rejected = assert.rejects(source.play(), { name: 'AbortError' })
  scene.dispose()
  await rejected
  await engine.dispose()
  activation.resolve()
  await unlockRejected
  assert.equal(context.sources.length, 0)
})

test('background preparation waits for a gesture and warms one recording at a time', async t => {
  const gate = deferred(), began = deferred()
  let calls = 0
  const { engine, stats } = fixture({ fetchFile: async() => {
    if (++calls === 1) { began.resolve(); return gate.promise }
    return response()
  } })
  t.after(() => engine.dispose())
  const first = engine.preload('first-warm.ogg'), second = engine.preload('second-warm.ogg')
  assert.equal(stats.contexts, 0)
  assert.equal(stats.fetches, 0)
  await engine.unlock()
  await began.promise
  assert.equal(stats.fetches, 1, 'warm-up must not start every decode concurrently')
  gate.resolve(response())
  await Promise.all([first, second])
  assert.equal(stats.fetches, 2)
  assert.equal(engine.preloadQueue.length, 0)
})

test('ending a not-yet-unlocked session cancels its warm-up queue without creating a context', async t => {
  const { engine, stats } = fixture()
  t.after(() => engine.dispose())
  const session = engine.createSession()
  session.preload('abandoned.ogg')
  assert.equal(engine.preloadQueue.length, 1)
  session.dispose()
  await Promise.resolve()
  assert.equal(engine.preloadQueue.length, 0)
  assert.equal(stats.contexts, 0)
  assert.equal(stats.fetches, 0)
})

test('only an explicitly allowed nonspatial UI sound may play in the ready phase', async t => {
  const { engine } = fixture()
  t.after(() => engine.dispose())
  await engine.unlock()
  const session = engine.createSession({ getListener: () => ({ position: { x: 0, y: 0 } }), coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
  session.setState('ready')
  assert.equal(session.emit('forbidden.ogg', { beforeStart: true, profile: 'rifle' }), null)
  assert.equal(session.emit('forbidden-spatial.ogg', { beforeStart: true, profile: 'rifle', spatial: { position: { x: 0, y: 0 } } }), null)
  const cue = session.emit('ready-ui.ogg', { beforeStart: true, profile: 'ui' })
  await cue.started
  assert.equal(cue.paused, false)
  session.setState('paused')
  assert.equal(cue.paused, true)
})
