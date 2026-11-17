import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import config from '/config.js'
import ManagedSound from '/core/io/ManagedSound.js'
import SceneAudio from '/core/io/SceneAudio.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'

class RecordingAudio extends EventTarget {
  constructor(src) {
    super()
    this.src = src
    this.volume = 1
    this.currentTime = 0
    this.paused = true
    this.ended = false
    this.plays = 0
  }

  play() {
    this.plays++
    this.paused = false
    this.ended = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }
}

let Top, Shell, Posada, Strelac, Wind, Airplane, GameObject2D, Ustanak, Tenk

before(async() => {
  createPageElements()
  globalThis.Audio = RecordingAudio
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ save() {}, restore() {}, clearRect() {} }))
  ;[Top, Shell, Posada, Strelac, Wind, Airplane, GameObject2D, Ustanak, Tenk] = await Promise.all([
    import('/scenes/ustanak/Top.js'), import('/core/actor/projectiles/Shell.js'),
    import('/scenes/ustanak/Posada.js'), import('/scenes/ustanak/Strelac.js'),
    import('/scenes/ustanak/Wind.js'), import('/core/objects/Airplane.js'),
    import('/core/actor/GameObject2D.js'), import('/scenes/ustanak/Main.js'),
    import('/scenes/tenkici/Tenk.js'),
  ]).then(modules => modules.map(module => module.default))
})

test('one-shot audio is silent before start, resumes its position after pause, and follows global volume', t => {
  const originalVolume = config.volume
  t.after(() => { config.volume = originalVolume })
  const sound = new ManagedSound('rifle.mp3', { volume: .5 })
  const owner = { sounds: [sound] }
  const audio = new SceneAudio()
  audio.sync([owner], 'ready')
  sound.play()
  audio.sync([owner], 'running')
  assert.equal(sound.audio.plays, 0)
  sound.play()
  assert.equal(sound.audio.volume, originalVolume * .5)
  sound.audio.currentTime = .25
  audio.sync([owner], 'paused')
  assert.ok(sound.audio.paused)
  sound.play()
  assert.equal(sound.audio.plays, 1, 'paused commands do not queue a new shot')
  config.volume = .2
  audio.sync([owner], 'running')
  assert.equal(sound.audio.currentTime, .25)
  assert.equal(sound.audio.volume, .1)
  assert.equal(sound.audio.plays, 2)
  sound.audio.ended = true
  sound.audio.dispatchEvent(new Event('ended'))
  audio.sync([owner], 'paused')
  audio.sync([owner], 'running')
  assert.equal(sound.audio.plays, 2, 'a completed shot is not replayed')
})

test('loops start once, follow their condition, and cannot restart after the scene ends', () => {
  const sound = new ManagedSound('wind.mp3', { loop: true })
  const owner = { sounds: [sound] }
  const audio = new SceneAudio()
  sound.setPlaying(true)
  audio.sync([owner], 'loading')
  assert.equal(sound.audio.plays, 0)
  audio.sync([owner], 'running')
  for (let i = 0; i < 10; i++) sound.setPlaying(true)
  assert.equal(sound.audio.plays, 1)
  audio.sync([], 'running')
  assert.ok(sound.audio.paused)
  assert.equal(sound.playing, false)
  audio.sync([owner], 'running')
  sound.setPlaying(true)
  audio.end()
  sound.setPlaying(true)
  sound.play()
  audio.sync([owner], 'running')
  assert.ok(sound.audio.paused)
  assert.equal(sound.audio.plays, 2)
})

test('new pooled projectiles retain their first sound and finishing one scene does not silence another', () => {
  const oldScene = new SceneAudio()
  const newScene = new SceneAudio()
  const owner = { children: [] }
  oldScene.sync([owner], 'running')
  const sound = new ManagedSound('explosion.mp3')
  owner.children.push({ sounds: [sound] })
  sound.play()
  oldScene.sync([owner], 'running')
  assert.equal(sound.audio.plays, 1)
  const other = new ManagedSound('wind.mp3', { loop: true })
  newScene.sync([{ sounds: [other] }], 'running')
  other.setPlaying(true)
  oldScene.end()
  assert.ok(sound.audio.paused)
  assert.equal(other.audio.paused, false)
})

test('only result sounds can continue after the match ends', () => {
  const shot = new ManagedSound('rifle.mp3')
  const result = new ManagedSound('fairy-arcade-sparkle.mp3', { afterFinish: true })
  const owner = { sounds: [shot, result] }
  const audio = new SceneAudio()
  audio.sync([owner], 'running')
  shot.play()
  result.play()
  audio.sync([owner], 'finished')
  assert.ok(shot.audio.paused)
  assert.equal(result.audio.paused, false)
  shot.play()
  assert.equal(shot.audio.plays, 1)
  audio.end()
  assert.ok(result.audio.paused)
})

test('a shared shell whistles during flight, explodes once at impact, and stops whistling on reset', () => {
  const shell = new Shell({ clock: new GameClock() })
  const audio = new SceneAudio()
  audio.sync([shell], 'running')
  shell.launch({ x: 100, y: 100 }, 0, 300)
  assert.equal(shell.flightSound.audio.plays, 1)
  const target = { lifeId: 1, takeHit() {} }
  shell.strike(target)
  shell.strike(target)
  assert.equal(shell.explosionSound.audio.plays, 1)
  assert.ok(shell.flightSound.audio.paused)
  shell.reset()
  assert.ok(shell.flightSound.audio.paused)
})

test('cannons sound only successful shots and round reset cancels their remaining sounds', () => {
  const cannon = new Top({ x: 100, y: 300, clock: new GameClock() })
  cannon.width = 100
  const audio = new SceneAudio()
  audio.sync([cannon], 'running')
  assert.ok(cannon.launch())
  assert.equal(cannon.launch(), false)
  assert.equal(cannon.shotSound.audio.plays, 1)
  assert.equal(cannon.projektili[0].flightSound.audio.plays, 1)
  cannon.resetRound()
  for (const owner of [cannon, ...cannon.projektili])
    for (const sound of owner.sounds) assert.ok(sound.audio.paused)
})

test('loading sounds once per animation transition and the rifle sounds when its firing animation starts', () => {
  const crew = new Posada(100, 300)
  const rifle = new Strelac(200, 300)
  for (const actor of [crew, rifle]) actor.onload()
  const audio = new SceneAudio()
  audio.sync([crew, rifle], 'running')
  crew.play('load')
  crew.play('load')
  assert.equal(crew.loadSound.audio.plays, 1)
  crew.fire()
  assert.ok(crew.loadSound.audio.paused)
  rifle.update(2.9)
  assert.equal(rifle.shotSound.audio.plays, 0)
  rifle.update(.1)
  assert.equal(rifle.animation.name, 'fire')
  assert.equal(rifle.shotSound.audio.plays, 1)
  rifle.resetRound()
  assert.ok(rifle.shotSound.audio.paused)
})

test('wind, visible aircraft and burning objects each own their continuous sound', () => {
  const wind = new Wind()
  const plane = new Airplane({ x: 200, y: 100, flammable: false })
  plane.width = 100
  plane.height = 30
  const burning = new GameObject2D(null, { x: 100, y: 100, flammable: true, alive: false })
  burning.flame = { update() {} }
  const audio = new SceneAudio()
  audio.sync([wind, plane, burning], 'running')
  wind.update()
  plane.update(0)
  burning.update(0)
  for (const sound of [wind.windSound, plane.engineSound, burning.burnSound]) assert.equal(sound.audio.paused, false)
  wind.enabled = false
  plane.hide()
  burning.alive = true
  wind.update()
  plane.update(0)
  burning.update(0)
  for (const sound of [wind.windSound, plane.engineSound, burning.burnSound]) assert.ok(sound.audio.paused)
})

test('tank sound follows the weapon cooldown and its dynamically pooled shells belong to the scene audio', () => {
  const tank = new Tenk(null, { clock: new GameClock(), groundY: 600 })
  const audio = new SceneAudio()
  audio.sync([tank], 'running')
  tank.fire({ x: 100, y: 100 }, 0)
  tank.fire({ x: 100, y: 100 }, 0)
  audio.sync([tank], 'running')
  assert.equal(tank.shotSound.audio.plays, 1)
  assert.equal(tank.loadSound.audio.plays, 1)
  assert.equal(tank.granate.projectiles[0].flightSound.audio.plays, 1)
  audio.end()
  assert.ok(tank.granate.projectiles[0].flightSound.audio.paused)
})

test('the real Ustanak scene switches fire by round and silences all owners on pause, result and exit', t => {
  const scene = new Ustanak()
  scene.init()
  scene.clear = () => {}
  t.mock.method(scene.gameLoop, 'start', () => { scene.gameLoop.loopId = 1 })
  t.after(() => scene.end())
  scene.start()
  scene.update(0)
  assert.equal(scene.wind.windSound.audio.paused, false)
  assert.ok(scene.battlefield.villageFire.fireSound.audio.paused)
  scene.round = 2
  scene.setRoundScenery()
  assert.equal(scene.battlefield.villageFire.fireSound.audio.paused, false)
  scene.pause()
  for (const sound of scene.sceneAudio.sounds) assert.ok(sound.audio.paused)
  scene.unpause()
  assert.equal(scene.battlefield.villageFire.fireSound.audio.paused, false)
  scene.round = 3
  scene.setRoundScenery()
  assert.ok(scene.battlefield.villageFire.fireSound.audio.paused)
  assert.equal(scene.battlefield.city.fireSound.audio.paused, false)
  scene.victory('Done')
  assert.ok(scene.battlefield.city.fireSound.audio.paused)
  assert.equal(scene.ui.victorySound.audio.paused, false)
  scene.end()
  assert.ok(scene.ui.victorySound.audio.paused)
})
