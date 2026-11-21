import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let BattleBackground, battlefields

before(async() => {
  createPageElements()
  // happy-dom has no 2D canvas
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({}))
  ;({ default: BattleBackground, battlefields } = await import('/scenes/tenkici/BattleBackground.js'))
})

test('smoke over the ruined city follows the signed wind', () => {
  const positions = []
  const ctx = { beginPath() {}, moveTo() {}, arc(x) {
    positions.push(x)
  }, fill() {} }
  const city = new BattleBackground({ getContext: () => ctx })
  city.crtez = ctx
  const profile = { x: 520, y: 241, faza: 2.7, broj: 4, trajanje: 16, speed: 18, vetar: 2, sirenje: 4, vijuganje: 5, seme: 1, nijansa: 36 }
  city.gustiDim(2, profile, 12)
  const right = [...positions]
  positions.length = 0
  city.gustiDim(2, profile, -12)
  assert.equal(positions.length, right.length)
  // Smoke born at this moment has not drifted yet.
  assert.ok(right.every((x, i) => x >= positions[i]))
  assert.ok(right.filter((x, i) => x > positions[i]).length > right.length / 2)
})

test('the city burns on its own time, and its fire is heard only while it is shown', () => {
  const city = new BattleBackground({ width: 800, height: 600, getContext: () => ({}) })
  const playing = []
  city.fireSound.setPlaying = value => playing.push(value)
  city.update(.5)
  city.active = false
  city.update(.25)
  assert.equal(city.vreme, .75)
  assert.deepEqual(playing, [true, false])
})

test('the city draws nothing until its picture has loaded', () => {
  const drawn = []
  const city = new BattleBackground({ width: 800, height: 600, getContext: () => ({ drawImage: () => drawn.push(1) }) })
  city.render()
  assert.equal(drawn.length, 0)
})

test('a picture is drawn with its own ground strip on the scene ground line', () => {
  const calls = []
  const canvas = { width: 800, height: 600, getContext: () => ({ drawImage: (...args) => calls.push(args) }) }
  const background = new BattleBackground(canvas, battlefields.sremFront1945, { groundY: 480 })
  const { width, height, ground } = battlefields.sremFront1945
  background.drawOnGround('picture', width, height)
  assert.deepEqual(calls.map(call => call.slice(1)), [
    [0, 0, width, height * ground, 0, 0, 800, 480],
    [0, height * ground, width, height * (1 - ground), 0, 480, 800, 120],
  ])
  assert.equal(background.toCanvas(width / 2, height * ground).y, 480, 'effects keep to the same ground')
})

test('a battlefield where nothing burns is not heard burning', () => {
  const quiet = new BattleBackground({ width: 800, height: 600, getContext: () => ({}) }, battlefields.drvar)
  const playing = []
  quiet.fireSound.setPlaying = value => playing.push(value)
  quiet.update(.1)
  assert.deepEqual(playing, [false])
})

function layerLoading(t, response = { ok: true, json: async() => ({ width: 1536, height: 1024 }) }) {
  const images = []
  t.mock.method(globalThis, 'fetch', async() => response)
  t.mock.method(globalThis, 'Image', class {
    constructor() {
      const image = Object.assign(new EventTarget(), { complete: false, naturalWidth: 0 })
      images.push(image)
      return image
    }
  })
  const background = new BattleBackground({ width: 800, height: 600, getContext: () => ({}) }, battlefields.batina)
  const loaded = image => {
    image.complete = true
    image.naturalWidth = 1536
    image.dispatchEvent(new Event('load'))
  }
  return { background, images, loaded }
}

test('the scene waits for Batina clouds as well as its environment plate, and loads no living things there', async t => {
  const { background, images, loaded } = layerLoading(t)
  const { default: Scene } = await import('/core/Scene.js')
  let ready = false
  const waiting = Scene.prototype.imagesLoaded.call({ children: [], background }).then(() => {
    ready = true
  })
  loaded(images[0])
  await Promise.resolve()
  assert.equal(ready, false, 'the clouds are still loading')
  loaded(images[1])
  await waiting
  assert.equal(ready, true)
  assert.equal(images.length, 2, 'only clouds move on Batina, by the owner\'s choice')
  assert.equal(background.layers.images.actors, undefined)
  assert.equal(background.scene.width, 1536)
  assert.equal(background.scene.height, 1024)
})

test('a failed Batina layout reaches the scene loading error path', async t => {
  const { background } = layerLoading(t, { ok: false })
  const { default: Scene } = await import('/core/Scene.js')
  await assert.rejects(Scene.prototype.imagesLoaded.call({ children: [], background }), /Background layout could not be loaded/)
})

test('a missing Batina cloud layer reaches the scene loading error path', async t => {
  const { background, images, loaded } = layerLoading(t)
  const { default: Scene } = await import('/core/Scene.js')
  const waiting = assert.rejects(Scene.prototype.imagesLoaded.call({ children: [], background }), /Image could not be loaded/)
  loaded(images[0])
  images[1].dispatchEvent(new Event('error'))
  await waiting
})

test('optional props are awaited and composed afresh without changing the source background image', async t => {
  const images = [], calls = []
  t.mock.method(globalThis, 'Image', class {
    constructor() {
      const image = Object.assign(new EventTarget(), { complete: false, naturalWidth: 0, naturalHeight: 0 })
      images.push(image)
      return image
    }
  })
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({
    save() {}, restore() {}, translate() {}, scale() {},
    clearRect: () => calls.push('clear'), drawImage: image => calls.push(image),
  }))
  const props = [{ id: 'partisan-fallen-prone', x: 700, y: 780 }]
  const background = new BattleBackground({ width: 800, height: 600, getContext: () => ({}) }, { ...battlefields.grahovo, props })
  const { default: Scene } = await import('/core/Scene.js')
  let ready = false
  const waiting = Scene.prototype.imagesLoaded.call({ children: [], background }).then(() => {
    ready = true
  })
  images[0].complete = true
  images[0].naturalWidth = 1536
  images[0].naturalHeight = 1024
  images[0].dispatchEvent(new Event('load'))
  await Promise.resolve()
  assert.equal(ready, false)
  images[1].complete = true
  images[1].naturalWidth = 128
  images[1].naturalHeight = 64
  images[1].dispatchEvent(new Event('load'))
  await waiting
  const picture = background.picture(0)
  assert.notEqual(picture, background.image)
  assert.equal(picture.width, 1536)
  assert.equal(picture.height, 1024)
  assert.equal(background.picture(2), picture)
  assert.deepEqual(calls, ['clear', images[0], images[1], 'clear', images[0], images[1]])
  assert.equal(background.image, images[0])
})
