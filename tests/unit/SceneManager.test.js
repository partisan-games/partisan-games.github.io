import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import SceneManager from '/scenes/SceneManager.js'
import { createSceneClass, flush } from './helpers/scenes.js'

let modules, imported, spinner

const createManager = () => {
  SceneManager.instance = null
  const manager = new SceneManager(path => {
    imported.push(path)
    return modules[path]()
  })
  manager.spinner = spinner
  return manager
}

beforeEach(() => {
  modules = {}
  imported = []
  spinner = { visible: false, show() {
    this.visible = true
  }, hide() {
    this.visible = false
  } }
})

test('starts a scene and hides the spinner', async() => {
  const log = []
  modules.game = async() => ({ default: createSceneClass({ log }) })

  await createManager().start('game')

  assert.equal(log[0].started, 1)
  assert.equal(spinner.visible, false)
})

test('an invalid scene name is rejected without importing anything', async() => {
  await assert.rejects(createManager().start('../secret'), /Invalid scene name/)
  assert.deepEqual(imported, [])
  assert.equal(spinner.visible, false)
})

test('a failed import rejects, leaves no scene and hides the spinner', async() => {
  modules.broken = () => Promise.reject(new Error('404'))
  const manager = createManager()

  await assert.rejects(manager.start('broken'), /404/)
  assert.equal(manager.scene, null)
  assert.equal(spinner.visible, false)
})

test('a failing init ends the half-built scene', async() => {
  const log = []
  modules.game = async() => ({ default: createSceneClass({ log, init: () => Promise.reject(new Error('model')) }) })
  const manager = createManager()

  await assert.rejects(manager.start('game'), /model/)
  assert.equal(log[0].ended, 1)
  assert.equal(manager.scene, null)
})

test('of two quick starts only the latest one runs and the older one stays silent', async() => {
  const log = []
  let finishSlowInit
  modules.slow = async() => ({ default: createSceneClass({ log, init: () => new Promise(r => {
    finishSlowInit = r
  }) }) })
  modules.fast = async() => ({ default: createSceneClass({ log }) })
  const manager = createManager()

  const slow = manager.start('slow')
  await flush()
  await manager.start('fast')
  finishSlowInit()
  await slow

  const [slowScene, fastScene] = log
  assert.equal(slowScene.ended, 2) // by the newer start, then again for what its init set up afterwards
  assert.equal(slowScene.started, 0)
  assert.equal(fastScene.started, 1)
  assert.equal(manager.scene, fastScene)
})

test('waits for the background image and reports a failed image without starting', async() => {
  for (const eventName of ['load', 'error']) {
    const log = []
    const image = Object.assign(new EventTarget(), { complete: false })
    modules.game = async() => ({ default: createSceneClass({ log, background: { image } }) })

    const starting = createManager().start('game')
    await flush()
    assert.equal(log[0].started, 0)

    image.dispatchEvent(new Event(eventName))
    if (eventName === 'load') {
      await starting
      assert.equal(log[0].started, 1)
    } else {
      await assert.rejects(starting, /Image could not be loaded/)
      assert.equal(log[0].started, 0)
      assert.equal(log[0].ended, 1)
    }
    assert.equal(spinner.visible, false)
  }
})

test('draws the complete scene before showing its start menu and hiding the spinner', async() => {
  const calls = []
  let finishImages
  const ready = new Promise(resolve => {
    finishImages = resolve
  })
  const log = []
  modules.game = async() => ({ default: class extends createSceneClass({ log }) {
    constructor() {
      super()
      this.hasStartScreen = true
      this.ui = { renderStartScreen: () => calls.push('menu') }
    }
    imagesLoaded() {
      return ready
    }
    clear() {
      calls.push('background')
    }
    render() {
      calls.push('objects')
    }
  } })
  const starting = createManager().start('game')
  await flush()
  assert.deepEqual(calls, [])
  assert.equal(spinner.visible, true)
  assert.equal(log[0].session.state, 'loading')
  finishImages()
  await starting
  assert.deepEqual(calls, ['background', 'objects', 'menu'])
  assert.equal(log[0].session.state, 'ready')
  assert.equal(log[0].started, 0)
  assert.equal(spinner.visible, false)
})

test('finishing old image loading cannot draw or start a scene after navigation', async() => {
  let finishImages
  const ready = new Promise(resolve => {
    finishImages = resolve
  })
  const log = []
  modules.old = async() => ({ default: class extends createSceneClass({ log }) {
    imagesLoaded() {
      return ready
    }
  } })
  modules.next = async() => ({ default: createSceneClass({ log }) })
  const manager = createManager()
  const old = manager.start('old')
  await flush()
  await manager.start('next')
  finishImages()
  await old
  assert.equal(log[0].started, 0)
  assert.equal(log[0].session.state, 'disposed')
  assert.equal(log[1].started, 1)
  assert.equal(manager.scene, log[1])
})
