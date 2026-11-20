import { test } from 'node:test'
import assert from 'node:assert/strict'
import AudioCoordinates from '/core/io/audio/AudioCoordinates.js'
import SpatialAudio, { distanceGain } from '/core/io/audio/SpatialAudio.js'
import { audioProfiles, resolveAudioProfile, distanceCutoff, createAudioRandom, sampleAudioRange } from '/core/io/audio/audioProfiles.js'

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`)
const coordinates = () => new AudioCoordinates({ dimensions: 2, unitsPerAudioUnit: 1 })

test('each spatial profile has a controlled near/middle/far example with monotone attenuation and filtering', () => {
  for (const [name, profile] of Object.entries(audioProfiles)) {
    if (!profile.nearDistance) continue
    const distances = [0, profile.nearDistance, (profile.nearDistance + profile.fadeStart) / 2, profile.fadeStart, (profile.fadeStart + profile.maxDistance) / 2, profile.maxDistance]
    let lastGain = 1, lastCutoff = profile.nearCutoff
    for (const distance of distances) {
      const ratio = Math.max(0, (distance - profile.nearDistance) / (profile.maxDistance - profile.nearDistance))
      const gain = distanceGain(distance, profile), cutoff = distanceCutoff(profile, ratio)
      assert.ok(gain <= lastGain, name)
      assert.ok(cutoff <= lastCutoff, name)
      lastGain = gain
      lastCutoff = cutoff
    }
    assert.equal(lastGain, 0)
    close(lastCutoff, profile.farCutoff)
  }
})

test('new profiles remain data; invalid group, filter, pitch and variation values are rejected', () => {
  const profile = resolveAudioProfile({ ...audioProfiles.engine, nearDistance: 3, trim: .6 })
  assert.equal(profile.nearDistance, 3)
  assert.equal(profile.trim, .6)
  assert.ok(Object.isFrozen(profile) && Object.isFrozen(profile.pitchRange))
  for (const invalid of ['missing', { group: 'missing' }, { trim: NaN }, { farCutoff: 0 }, { panWidth: 2 }, { minRate: .8 }, { pitchRange: [1.1, .9] }, { group: 'speech', doppler: true }, { group: 'music', pitchRange: [.99, 1.01] }])
    assert.throws(() => resolveAudioProfile(invalid))
})

test('physical approach and recession change pitch smoothly within the accepted bounds', () => {
  const world = coordinates(), frame = world.frame()
  const player = { position: { x: 0, y: 0 } }, position = { x: 20, y: 0 }
  const model = new SpatialAudio({ getPosition: () => position }, audioProfiles.engine, world)
  close(model.update(frame.listener(player), frame, 0).dopplerRate, 1)
  position.x = 10
  const approaching = model.update(frame.listener(player), frame, 1).dopplerRate
  assert.ok(approaching > 1 && approaching <= 1.1)
  position.x = 40
  const receding = model.update(frame.listener(player), frame, 1).dopplerRate
  assert.ok(receding < 1 && receding >= .9)
})

test('common translation and constant-distance sideways motion produce neutral Doppler', () => {
  const world = coordinates(), frame = world.frame()
  const player = { position: { x: 0, y: 0 } }, position = { x: 10, y: 0 }
  const model = new SpatialAudio({ getPosition: () => position }, audioProfiles.engine, world)
  model.update(frame.listener(player), frame, 0)
  player.position.x += 4
  position.x += 4
  close(model.update(frame.listener(player), frame, 1).dopplerRate, 1)
  position.x = 4
  position.y = 10
  close(model.update(frame.listener(player), frame, 1).dopplerRate, 1)
})

test('source teleport, listener teleport, turn change, pause reset and zero elapsed time do not create pitch spikes', () => {
  const world = coordinates(), frame = world.frame()
  const player = { identity: 'first', revision: 0, position: { x: 0, y: 0 } }, position = { x: 20, y: 0 }
  let revision = 0
  const model = new SpatialAudio({ getPosition: () => position, getRevision: () => revision }, audioProfiles.engine, world)
  model.update(frame.listener(player), frame, 0)
  position.x = 10
  assert.ok(model.update(frame.listener(player), frame, 1).dopplerRate > 1)
  position.x = 100
  revision++
  close(model.update(frame.listener(player), frame, .01).dopplerRate, 1)
  player.position.x = 90
  player.revision++
  close(model.update(frame.listener(player), frame, .01).dopplerRate, 1)
  player.position.x = 0
  player.identity = 'second'
  close(model.update(frame.listener(player), frame, .01).dopplerRate, 1)
  model.resetMotion()
  position.x = 1
  close(model.update(frame.listener(player), frame, .01).dopplerRate, 1)
  position.x = 50
  close(model.update(frame.listener(player), frame, 0).dopplerRate, 1)
})

test('speech retains its pitch while the source moves; music and UI profiles also forbid Doppler', () => {
  const world = coordinates(), frame = world.frame()
  const player = { position: { x: 0, y: 0 } }, position = { x: 10, y: 0 }
  const model = new SpatialAudio({ getPosition: () => position }, audioProfiles.speech, world)
  model.update(frame.listener(player), frame, 0)
  position.x = 1
  close(model.update(frame.listener(player), frame, 1).dopplerRate, 1)
  assert.equal(audioProfiles.music.doppler, false)
  assert.equal(audioProfiles.ui.doppler, false)
})

test('audio variation has its own repeatable random stream and leaves gameplay randomness untouched', t => {
  t.mock.method(Math, 'random', () => {
    throw new Error('gameplay random consumed')
  })
  const first = createAudioRandom(), second = createAudioRandom()
  for (let i = 0; i < 30; i++) {
    const a = sampleAudioRange(first, [.98, 1.02]), b = sampleAudioRange(second, [.98, 1.02])
    assert.equal(a, b)
    assert.ok(a >= .98 && a <= 1.02)
  }
})
