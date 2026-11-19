import { test } from 'node:test'
import assert from 'node:assert/strict'
import AudioCoordinates from '/core/io/audio/AudioCoordinates.js'
import SpatialAudio, { distanceGain, spatialSample } from '/core/io/audio/SpatialAudio.js'
import { screenMix } from '/core/io/audio/audioProfiles.js'

const profile = { nearDistance: 1, fadeStart: 8, maxDistance: 10 }
const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)
const coordinates2D = options => new AudioCoordinates({ dimensions: 2, unitsPerAudioUnit: 100, ...options })
const coordinates3D = () => new AudioCoordinates({ dimensions: 3, unitsPerAudioUnit: 1 })
const player3D = position => ({ position, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } })

test('equivalent acoustic positions use identical distance, gain, pan and distance mix in 2D and 3D', () => {
  const plane = coordinates2D().frame(), space = coordinates3D().frame()
  const first = spatialSample(plane.listener({ position: { x: 0, y: 0 } }), plane.position({ x: 300, y: -400, z: 99999 }), profile)
  const second = spatialSample(space.listener(player3D({ x: 0, y: 0, z: 0 })), space.position({ x: 3, y: 4, z: 0 }), profile)
  for (const key of ['distance', 'gain', 'pan', 'distanceRatio', 'cutoff']) close(first[key], second[key])
  close(first.distance, 5)
  close(first.gain, .2)
  close(first.pan, .6)
})

test('the common distance curve has a near plateau, inverse attenuation and smooth exact silence at its limit', () => {
  assert.equal(distanceGain(0, profile), 1)
  assert.equal(distanceGain(.5, profile), 1)
  assert.equal(distanceGain(1, profile), 1)
  assert.equal(distanceGain(2, profile), .5)
  close(distanceGain(9, profile), 1 / 18)
  assert.equal(distanceGain(10, profile), 0)
  assert.equal(distanceGain(100, profile), 0)
  assert.ok(distanceGain(10 - 1e-4, profile) < 1e-8)
  for (const invalid of [-1, NaN, Infinity]) assert.throws(() => distanceGain(invalid, profile), RangeError)
  for (const invalid of [null, {}, { nearDistance: 0, fadeStart: 8, maxDistance: 10 }, { nearDistance: 1, fadeStart: 10, maxDistance: 10 }])
    assert.throws(() => distanceGain(1, invalid))
})

test('coincident positions have finite centered sound; 2D sides do not reverse with player facing', () => {
  const frame = coordinates2D().frame()
  const player = { position: { x: 500, y: 200 }, forward: { x: -1, y: 0 } }
  const listener = frame.listener(player)
  const same = spatialSample(listener, frame.position(player.position), profile)
  assert.equal(same.pan, 0)
  assert.equal(same.gain, 1)
  assert.equal(spatialSample(listener, frame.position({ x: 600, y: 200 }), profile).pan, 1)
  assert.equal(spatialSample(listener, frame.position({ x: 400, y: 200 }), profile).pan, -1)
})

test('3D stereo follows player orientation, including its world up, rather than a camera offset', () => {
  const frame = coordinates3D().frame()
  const player = player3D({ x: 0, y: 0, z: 0 })
  const source = frame.position({ x: 3, y: 0, z: 0 })
  assert.equal(spatialSample(frame.listener(player), source, profile).pan, 1)
  player.forward = { x: 1, y: 0, z: 0 }
  close(spatialSample(frame.listener(player), source, profile).pan, 0)
  player.forward = { x: 0, y: 0, z: 1 }
  assert.equal(spatialSample(frame.listener(player), source, profile).pan, -1)
  player.forward = { x: 0, y: 1, z: 0 }
  player.up = { x: 0, y: 0, z: 1 }
  assert.equal(spatialSample(frame.listener(player), source, profile).pan, 1)
})

test('missing players, invalid world frames and invalid 3D orientation have no screen-center fallback', () => {
  for (const options of [{}, { dimensions: 4, unitsPerAudioUnit: 1 }, { dimensions: 2, unitsPerAudioUnit: 0 }])
    assert.throws(() => new AudioCoordinates(options))
  const plane = coordinates2D().frame(), space = coordinates3D().frame()
  assert.throws(() => plane.listener(null))
  assert.throws(() => plane.position({ x: 1 }))
  assert.throws(() => plane.position({ x: Infinity, y: 0 }))
  assert.throws(() => space.position({ x: 1, y: 2 }))
  assert.throws(() => space.listener({ position: { x: 0, y: 0, z: 0 } }))
  assert.throws(() => space.listener({ ...player3D({ x: 0, y: 0, z: 0 }), up: { x: 0, y: 0, z: -1 } }))
})

test('area sound uses the closest point, including its boundary and players inside it', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  const bounds = { min: { x: 200, y: 100 }, max: { x: 600, y: 400 } }
  const model = new SpatialAudio({ getArea: () => bounds }, profile, coordinates)
  const player = { position: { x: 100, y: 200 } }
  close(model.update(frame.listener(player), frame, 0).distance, 1)
  player.position.x = 200
  close(model.update(frame.listener(player), frame, 1).distance, 0)
  player.position.x = 450
  const inside = model.update(frame.listener(player), frame, 1)
  assert.equal(inside.distance, 0)
  close(inside.gain, 1)
  close(inside.pan, 0)
  player.position = { x: 0, y: -100 }
  close(model.update(frame.listener(player), frame, 1).distance, Math.hypot(2, 2))
  assert.throws(() => frame.nearestPoint({ min: { x: 10, y: 10 }, max: { x: 0, y: 0 } }, { x: 0, y: 0, z: 0 }))
})

test('3D areas include height and depth rather than just their ground footprint', () => {
  const coordinates = coordinates3D(), frame = coordinates.frame()
  const model = new SpatialAudio({ getArea: () => ({ min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } }) }, profile, coordinates)
  const sample = model.update(frame.listener(player3D({ x: 1, y: 5, z: 6 })), frame, 0)
  close(sample.distance, 5)
  assert.deepEqual(sample.sourcePosition, { x: 1, y: 2, z: 2 })
})

test('scroll offset moves player and live sources into one world while frozen events keep their emission point', () => {
  const offset = { x: 0, y: 0 }
  let reads = 0
  const coordinates = coordinates2D({ getWorldOffset: () => { reads++; return offset } })
  const position = { x: 500, y: 0 }
  const player = { position: { x: 100, y: 0 } }
  const frozen = new SpatialAudio({ position }, profile, coordinates)
  const moving = new SpatialAudio({ getPosition: () => position }, profile, coordinates)
  offset.x = 200
  player.position.x -= 200
  position.x -= 200
  const frame = coordinates.frame(), listener = frame.listener(player)
  const first = frozen.update(listener, frame, 0), second = moving.update(listener, frame, 0)
  close(first.distance, 4)
  close(second.distance, 4)
  close(first.sourcePosition.x, 5)
  close(second.sourcePosition.x, 5)
  assert.equal(reads, 2, 'one snapshot when freezing an event and one shared frame snapshot')
  position.x += 100
  close(frozen.update(listener, frame, 1).sourcePosition.x, 5)
  close(moving.update(listener, frame, 1).sourcePosition.x, 6)
})

test('resize, zoom and camera movement cannot enter the world-coordinate conversion', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  const player = { position: { x: 100, y: 200 }, camera: { x: 0, y: 0, zoom: 1 } }
  const first = spatialSample(frame.listener(player), frame.position({ x: 400, y: 200 }), profile)
  player.camera = { x: 9999, y: -500, zoom: .2, width: 4000, height: 100 }
  assert.deepEqual(spatialSample(frame.listener(player), frame.position({ x: 400, y: 200 }), profile), first)
})

test('listener switches keep exact new geometry while output transitions finish in half a second at 30/60/144 Hz', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  const first = { position: { x: 0, y: 200 } }, second = { position: { x: 400, y: 200 } }
  for (const hz of [30, 60, 144]) {
    const model = new SpatialAudio({ position: { x: 100, y: 200 } }, profile, coordinates)
    const initialGain = model.update(frame.listener(first), frame, 0).gain
    const changed = model.update(frame.listener(second), frame, 0)
    assert.deepEqual(changed.listenerPosition, { x: 4, y: -2, z: 0 })
    assert.equal(changed.distance, 3)
    assert.equal(changed.gain, initialGain)
    assert.equal(changed.pan, 1)
    for (let i = 0; i < hz / 2; i++) model.update(frame.listener(second), frame, 1 / hz)
    close(model.current.gain, 1 / 3)
    close(model.current.pan, -1)
  }
})

test('moving player coordinates stay exact at every update and ordinary smoothing is frame-rate independent', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  const results = []
  for (const hz of [30, 60, 144]) {
    const player = { position: { x: 0, y: 0 } }
    const model = new SpatialAudio({ position: { x: 600, y: 0 } }, profile, coordinates)
    model.update(frame.listener(player), frame, 0)
    player.position.x = 400
    for (let i = 0; i < hz; i++) {
      const current = model.update(frame.listener(player), frame, 1 / hz)
      assert.equal(current.listenerPosition.x, 4)
      assert.equal(current.distance, 2)
    }
    results.push(model.current.gain)
  }
  close(results[0], results[1])
  close(results[1], results[2])
})

test('a moving player is never replaced by an interpolated listener position at 30/60/144 Hz', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  for (const hz of [30, 60, 144]) {
    const player = { position: { x: 0, y: 0 } }
    const model = new SpatialAudio({ position: { x: 1000, y: 0 } }, profile, coordinates)
    for (let step = 1; step <= hz; step++) {
      player.position.x = step / hz * 500
      const sample = model.update(frame.listener(player), frame, 1 / hz)
      close(sample.listenerPosition.x, player.position.x / 100)
      close(sample.distance, 10 - player.position.x / 100)
    }
  }
})

test('fresh pose objects keep a stable player identity; teleport revisions start output transitions without fake positions', () => {
  const coordinates = coordinates2D(), frame = coordinates.frame()
  const model = new SpatialAudio({ position: { x: 100, y: 200 } }, profile, coordinates)
  const pose = (identity, x, revision = 0) => frame.listener({ identity, revision, position: { x, y: 200 } })
  model.update(pose('first', 0), frame, 0)
  model.update(pose('second', 400), frame, .25)
  assert.equal(model.current.pan, 0)
  model.update(pose('second', 400), frame, .25)
  assert.equal(model.current.pan, -1, 'new pose objects do not restart the same transition')
  const teleported = model.update(pose('second', 0, 1), frame, 0)
  assert.equal(teleported.distance, 1)
  assert.equal(teleported.listenerPosition.x, 0)
  assert.equal(teleported.pan, -1)
  assert.equal(model.update(pose('second', 0, 1), frame, .5).pan, 1)
  for (const dt of [-1, NaN, Infinity]) assert.throws(() => model.update(pose('second', 0, 1), frame, dt), /simulation step/)
})

test('on a 2D screen distance lowers a source by at most the screen span, and a source off screen fades to silence', () => {
  const viewport = { min: { x: 0, y: 0 }, max: { x: 1920, y: 1080 } }
  const frame = coordinates2D({ getViewport: () => viewport }).frame()
  const listener = frame.listener({ position: { x: 0, y: 0 } })
  const at = (x, y) => spatialSample(listener, frame.position({ x, y }), profile, {}, frame.viewport)
  const beside = at(0, 0), corner = at(1920, 1080)
  assert.equal(beside.screen, true)
  assert.equal(beside.gain, 1)
  close(corner.gain, 10 ** (-screenMix.span / 20))
  assert.equal(corner.distanceRatio, 1)
  assert.ok(at(1920 + 20, 1080).gain > 0, 'a source just leaving the screen fades instead of stopping')
  assert.equal(at(1920 * 2, 1080).gain, 0)
  assert.ok(corner.gain > distanceGain(corner.distance, profile), 'the screen, not the profile range, sets on-screen distance')
})
