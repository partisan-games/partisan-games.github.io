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

test('waits for the background image before the intro, also when the image fails', async() => {
  for (const eventName of ['load', 'error']) {
    const log = []
    const slika = Object.assign(new EventTarget(), { complete: false })
    modules.game = async() => ({ default: createSceneClass({ log, pozadina: { slika } }) })

    const starting = createManager().start('game')
    await flush()
    assert.equal(log[0].started, 0)

    slika.dispatchEvent(new Event(eventName))
    await starting
    assert.equal(log[0].started, 1, eventName)
  }
})
