import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, BoxGeometry, Scene, AmbientLight } from 'three'
import { createPageElements } from './helpers/dom.js'
import * as timers from '/core/timers.js'

/** Records every sound a game object makes: its file and its volume when it starts playing. */
class FakeAudio {
  static played = []
  constructor(src = '') {
    this.src = src
    this.volume = 1
    this.currentTime = 0
    this.paused = true
  }

  play() {
    FakeAudio.played.push({ file: this.src.replace(/^\/assets\/sounds\//, ''), volume: Number(this.volume.toFixed(4)) })
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  load() {
    this.play()
  }

  addEventListener() {}
}

/** Runs the code with Math.random fixed and returns the sounds it played. */
function soundsOf(action, random = .5) {
  FakeAudio.played = []
  const restore = mock.method(Math, 'random', () => random)
  action()
  restore.mock.restore()
  return FakeAudio.played
}

before(() => {
  createPageElements()
  globalThis.Audio = FakeAudio
})

// the game volume is 0.4 (config.js); random volumes lie between 0.5 and 1.25 of it

test('the gun sight shot plays at the game volume', async() => {
  const { default: mish } = await import('/core/io/mish.js')
  mish.dodajNishan()
  assert.deepEqual(soundsOf(() => mish.pucaj()), [{ file: 'pucanj.wav', volume: .4 }])
  mish.ukloniNishan()
})

test('the occupier burst plays at a random volume around the game volume', async() => {
  const { default: Okupator } = await import('/core/actor/Okupator.js')
  const occupier = new Okupator()
  assert.deepEqual(soundsOf(() => occupier.pucaj(0), 0), [{ file: 'rafal.mp3', volume: .2 }])
  assert.deepEqual(soundsOf(() => occupier.pucaj(0), .5), [{ file: 'rafal.mp3', volume: .35 }])
})

test('the trench soldier burst plays at the random volume picked when he appears', async() => {
  const { default: Svabo } = await import('/scenes/neretva/Svabo.js')
  let soldier
  soundsOf(() => {
    soldier = new Svabo({ skalar: 1, callback: () => {} })
  }, 1)
  soldier.jeSpreman = () => true
  assert.deepEqual(soundsOf(() => soldier.update(1 / 60), 0), [{ file: 'rafal.mp3', volume: .5 }])
})

test('an attack sound plays at a random volume around the game volume', async() => {
  const { default: Actor } = await import('/core3d/actor/Actor.js')
  const actor = new Actor({ mesh: new Mesh(new BoxGeometry(1, 2, 1)), attackSound: 'rifle.mp3' })
  assert.deepEqual(soundsOf(() => actor.playAttackSound(), 1), [{ file: 'rifle.mp3', volume: .5 }])
})

test('a coin sparkles at the game volume', async() => {
  const { default: Coin } = await import('/core3d/objects/Coin.js')
  const coin = new Coin()
  assert.deepEqual(soundsOf(() => coin.playSound()), [{ file: 'fairy-arcade-sparkle.mp3', volume: .4 }])
})

test('rain plays at half the game volume', async() => {
  const { Rain } = await import('/core3d/Particles.js')
  const rain = new Rain()
  assert.deepEqual(soundsOf(() => rain.update(1 / 60)), [{ file: 'rain.mp3', volume: .2 }])
})

test('thunder is quieter the farther the lightning strikes', async() => {
  const { lightningStrike } = await import('/core3d/light.js')
  const strike = random => soundsOf(() => {
    lightningStrike(new AmbientLight(), new Scene())
    timers.update(10)
  }, random)

  assert.deepEqual(strike(0), [{ file: 'thunder.mp3', volume: .4 }])
  assert.deepEqual(strike(.9999), [{ file: 'thunder.mp3', volume: .1 }])
})

test('the patrol talks at the game volume', async() => {
  const { default: Patrola } = await import('/scenes/ranjenik/Patrola.js')
  const patrol = new Patrola()
  assert.deepEqual(soundsOf(() => patrol.pustiNadjen(), 0), [{ file: 'patrola/Stop.wav', volume: .4 }])
})

test('the start screen report types at the game volume', async() => {
  const { default: Report } = await import('/ui/Report.js')
  const container = document.createElement('div')
  container.id = 'sound-report'
  document.body.appendChild(container)
  let report
  assert.deepEqual(soundsOf(() => {
    report = new Report({ text: 'x', containerId: 'sound-report' })
  }), [{ file: 'typing.mp3', volume: .4 }])
  report.stop()
  await new Promise(resolve => {
    setTimeout(resolve, 10) // the report adds its paper to the container a moment later
  })
  container.remove()
})

test('a shell explosion in ranjenik plays at a random volume around the game volume', async() => {
  const { default: Paljba } = await import('/scenes/ranjenik/Paljba.js')
  assert.deepEqual(soundsOf(() => new Paljba(), 1), [{ file: 'explosion.mp3', volume: .5 }])
})

test('every bullet of the vis plane is heard as it leaves the gun, at a random volume', async t => {
  const { Avionce } = await import('/scenes/vis/Avionce.js')
  const player = new Avionce()
  t.after(() => player.end())
  const fire = () => {
    player.reload = 0
    player.puca()
  }
  const shot = { file: 'pucanj.wav', volume: .2 }

  assert.deepEqual(soundsOf(() => {
    fire()
    fire()
  }, 0), [shot, shot])
  player.fireLevel = 1 // two guns
  assert.deepEqual(soundsOf(fire, 0), [shot, shot])
})

test('a vis enemy explodes once when shot down, at a random volume', async() => {
  const { default: Enemy } = await import('/scenes/vis/Enemy.js')
  const enemy = new Enemy()
  assert.deepEqual(soundsOf(() => enemy.damage(enemy.hits), 1), [{ file: 'explosion.mp3', volume: .5 }])
  assert.deepEqual(soundsOf(() => enemy.damage(1)), [])
})

test('the vis engine hums in a loop while the game runs, and stops in a pause, at the end screen and when the game ends', async() => {
  const { default: Vis } = await import('/scenes/vis/Main.js')
  const scene = new Vis()
  scene.init()
  scene.clear = () => {} // happy-dom has no 2D canvas to draw the background on
  const { engineSound } = scene
  const hum = [{ file: 'avion-mali.mp3', volume: .12 }]

  assert.deepEqual(soundsOf(() => scene.start()), hum)
  assert.ok(engineSound.loop)
  scene.pause()
  assert.ok(engineSound.paused)
  assert.deepEqual(soundsOf(() => scene.unpause()), hum)
  scene.defeat()
  assert.ok(engineSound.paused)
  engineSound.play()
  scene.end()
  assert.ok(engineSound.paused)
})

test('the otpisani music plays at the game volume', async() => {
  const { default: Otpisani } = await import('/scenes/otpisani/Main.js')
  const scene = new Otpisani()
  scene.init()
  assert.deepEqual(soundsOf(() => scene.audio.play()), [{ file: 'otpisani.mp3', volume: .4 }])
  scene.clear = () => {} // happy-dom has no 2D canvas to draw the background on
  scene.end()
})
