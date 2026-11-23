import { test, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { createSceneClass, settle } from './helpers/scenes.js'
import SceneManager from '/scenes/SceneManager.js'

const log = []
const modal = () => document.getElementById('modal')
const games = ['first', 'second', 'third', 'fourth', 'fifth']
let arcade

const menuCard = path => `<div class="arcade-cabinet" data-path="${path}"><h3>${path}</h3><img></div>`

/** Opens a game the way a player does: its address opens it, with no token asked for. */
async function play(path) {
  location.hash = `#${path}`
  await settle()
}

before(async() => {
  createPageElements()
  document.body.insertAdjacentHTML('beforeend', games.map(menuCard).join(''))
  SceneManager.instance = null
  const manager = new SceneManager(async path => {
    if (path === 'missing') throw new Error('404')
    return { default: createSceneClass({ log }) }
  })
  manager.spinner = { show() {}, hide() {} }

  location.hash = '#first'
  ;({ arcade } = await import('/scenes/main.js'))
  await settle()
})

after(() => arcade.dispose())

test('the game in the address starts on load', () => {
  assert.equal(log.length, 1)
  assert.equal(log[0].started, 1)
})

test('changing the address switches to the other game', async() => {
  await play('second')

  assert.equal(log[0].ended, 1)
  assert.equal(log[1].started, 1)
})

test('an unknown game shows an error with a way back to the menu', async() => {
  location.hash = '#missing'
  await settle()

  assert.match(modal().textContent, /could not be loaded/)
  assert.ok(modal().querySelector('#menu'))
})

test('an error during play stops the game and shows a message', async() => {
  await play('third')
  const scene = log.at(-1)

  window.dispatchEvent(new ErrorEvent('error', { error: new Error('boom') }))

  assert.equal(scene.ended, 1)
  assert.match(modal().textContent, /stopped because of an error/)
})

test('a sound blocked by the browser does not stop the game', async() => {
  await play('fourth')
  const scene = log.at(-1)

  const reason = new DOMException('play() failed', 'NotAllowedError')
  window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason }))

  assert.equal(scene.ended, 0)
})

test('play again starts the same game anew without reloading the page', async() => {
  await play('fifth')
  const scene = log.at(-1)
  const reload = mock.method(location, 'reload', () => {})
  modal().innerHTML = '<button id="igraj-opet">Play again</button>'

  modal().querySelector('#igraj-opet').click()
  await settle()

  assert.equal(reload.mock.callCount(), 0)
  assert.equal(scene.ended, 1)
  assert.notEqual(log.at(-1), scene)
  assert.equal(log.at(-1).started, 1)
  assert.equal(location.hash, '#fifth')
  assert.equal(modal().innerHTML, '')
  reload.mock.restore()
})
