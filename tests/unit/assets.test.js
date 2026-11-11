import { test, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

// the files that game code asks for, as paths from the site root
const requested = []
const pathOf = url => new URL(url, location.href).pathname

before(() => {
  createPageElements()
  mock.method(globalThis, 'fetch', input => {
    requested.push(pathOf(input.url ?? input))
    return Promise.reject(new Error('no network in unit tests'))
  })
  const createElementNS = document.createElementNS.bind(document)
  mock.method(document, 'createElementNS', (namespace, name) => {
    const element = createElementNS(namespace, name)
    if (name === 'img') Object.defineProperty(element, 'src', { set: url => requested.push(pathOf(url)) })
    return element
  })
})

after(() => mock.restoreAll())

const tick = () => new Promise(resolve => {
  setTimeout(resolve, 10)
})

/** Starts a loader and returns the first path it asks for; the file never arrives. */
async function requestsOf(load) {
  requested.length = 0
  load().catch(() => {})
  // the first call also loads the three.js loader module
  for (let i = 0; i < 300 && !requested.length; i++) await tick()
  return [...requested]
}

test('2D objects and backgrounds take their images from /assets/images', async() => {
  const { default: Predmet } = await import('/core/actor/Predmet.js')
  const { default: Pozadina } = await import('/core/objects/Pozadina.js')

  assert.equal(pathOf(new Predmet('armies/tenk.png').slika.src), '/assets/images/armies/tenk.png')
  assert.equal(pathOf(new Pozadina('background/nebo.jpg').slika.src), '/assets/images/background/nebo.jpg')
})

test('model loaders take models from /assets/models and textures from /assets/images/textures', async() => {
  const loaders = await import('/core3d/loaders.js')

  assert.deepEqual(await requestsOf(() => loaders.loadGlb({ file: 'tank/tank.glb' })), ['/assets/models/tank/tank.glb'])
  assert.deepEqual(await requestsOf(() => loaders.loadFbx({ file: 'soldier/soldier.fbx' })), ['/assets/models/soldier/soldier.fbx'])
  assert.deepEqual(await requestsOf(() => loaders.loadDae({ file: 'house/house.dae' })), ['/assets/models/house/house.dae'])
  assert.deepEqual(await requestsOf(() => loaders.loadObj({ file: 'boat/boat.obj', mtl: 'boat/boat.mtl' })), ['/assets/models/boat/boat.mtl'])
  assert.deepEqual(await requestsOf(() => loaders.loadMd2({ file: 'ogro/ogro.md2', texture: 'ogro/skin.jpg' })), ['/assets/models/ogro/skin.jpg'])
})

test('textured shapes take their textures from /assets/images/textures', async() => {
  const { createBox } = await import('/core3d/geometry/index.js')
  assert.deepEqual(await requestsOf(async() => createBox({ file: 'crate.gif' })), ['/assets/images/textures/crate.gif'])
})

test('sounds come from /assets/sounds', async() => {
  const { createSound } = await import('/core/io/sound.js')
  assert.equal(pathOf(createSound('rafal.mp3').src), '/assets/sounds/rafal.mp3')
})
