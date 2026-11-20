import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let UI
const fakeScene = { sceneUI: () => '' }

before(async() => {
  createPageElements()
  UI = (await import('/ui/UI.js')).default
})

test('start, pause and end screens never add a full screen button', () => {
  const ui = new UI(fakeScene)
  assert.equal(document.querySelectorAll('full-screen-btn').length, 0)
  for (const show of [
    () => ui.renderStartScreen(),
    () => ui.showPauseScreen(),
    () => ui.showDefeatScreen('Finished'),
    () => ui.showVictoryScreen('Finished'),
  ]) {
    show()
    assert.equal(document.querySelectorAll('full-screen-btn').length, 0)
  }
  ui.end()
  assert.equal(document.querySelectorAll('full-screen-btn').length, 0)
})

test('switching games does not add a full screen button', () => {
  for (let i = 0; i < 3; i++) new UI(fakeScene).end()
  const last = new UI(fakeScene)

  assert.equal(document.querySelectorAll('full-screen-btn').length, 0)
  last.end()
})

test('a message requested after the game ended is not shown', () => {
  const ui = new UI(fakeScene)
  ui.end()
  ui.showMessage('late message')

  assert.equal(document.getElementById('modal').innerHTML, '')
})

test('end stops the typing report of the start screen', () => {
  const ui = new UI(fakeScene)
  let stopped = false
  ui.report = { stop: () => {
    stopped = true
  } }

  ui.end()
  assert.equal(stopped, true)
})

test('a message does not cover the end screen', () => {
  const ui = new UI(fakeScene)
  ui.showDefeatScreen('burned')

  ui.showMessage('you are burning')
  assert.match(document.getElementById('modal').textContent, /burned/)
  assert.doesNotMatch(document.body.textContent, /you are burning/)
  ui.end()
})

test('a message from a game that has ended does not clear the next game screen later', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const ui = new UI(fakeScene)
  ui.showMessage('destroy the factories')
  ui.end()

  const modal = document.getElementById('modal')
  modal.innerHTML = '<button id="start">Start</button>'
  t.mock.timers.tick(3000)

  assert.equal(modal.querySelector('#start')?.id, 'start')
})

test('a message does not cover the pause menu', () => {
  const ui = new UI(fakeScene)
  ui.showPauseScreen()

  ui.showMessage('Click to morph city')
  assert.match(document.getElementById('modal').textContent, /Game paused/)
  assert.doesNotMatch(document.body.textContent, /morph city/)
  ui.end()
})

test('start screen reports share one stylesheet', async() => {
  const { default: Report } = await import('/ui/Report.js')
  const container = document.createElement('div')
  container.id = 'report-test'
  document.body.appendChild(container)
  const countStyles = () => [...document.head.querySelectorAll('style')].filter(style => style.textContent.includes('1942 Report')).length

  for (let i = 0; i < 3; i++) new Report({ text: 'x', containerId: 'report-test' }).stop()

  assert.equal(countStyles(), 1)
  assert.equal(container.querySelectorAll('.report').length, 3)
  container.remove()
})

for (const middle of ['same', 'different'])
  test(`the latest repeated message keeps its full duration (${middle})`, t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const ui = new UI(fakeScene)
    t.after(() => ui.end())
    ui.showMessage('same')
    t.mock.timers.tick(1000)
    ui.showMessage(middle)
    t.mock.timers.tick(1000)
    ui.showMessage('same')
    t.mock.timers.tick(2999)
    assert.match(ui.messageElement.textContent, /same/)
    t.mock.timers.tick(1)
    assert.equal(ui.messageElement.textContent, '')
  })

test('a stopped report cannot insert itself into a replacement start screen', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { default: Report } = await import('/ui/Report.js')
  const original = document.createElement('div')
  original.id = 'report-replaced'
  document.body.appendChild(original)
  const report = new Report({ text: 'Old orders', container: original })
  report.stop()
  assert.equal(original.querySelectorAll('.report').length, 1)
  const replacement = document.createElement('div')
  replacement.id = original.id
  original.replaceWith(replacement)
  t.after(() => replacement.remove())
  t.mock.timers.tick(10)
  assert.equal(replacement.children.length, 0)
})

test('the pause screen opens shared settings whose volume slider changes and remembers the game volume', async() => {
  const { default: config } = await import('/config.js')
  const original = config.volume
  const ui = new UI(fakeScene, { onContinue() {} })
  const modal = document.getElementById('modal')
  const click = id => modal.querySelector(`#${id}`).dispatchEvent(new Event('click', { bubbles: true }))
  ui.showPauseScreen()
  click('settings')
  const slider = modal.querySelector('#volume')
  assert.equal(Number(slider.value), Math.round(original * 100))
  slider.value = '70'
  slider.dispatchEvent(new Event('input', { bubbles: true }))
  assert.equal(config.volume, .7)
  assert.equal(JSON.parse(localStorage.getItem('partisan-games-settings')).volume, .7)
  click('settings-back')
  assert.match(modal.textContent, /Game paused/)
  assert.equal(ui.screen, 'pause')
  ui.end()
  config.volume = original
  localStorage.removeItem('partisan-games-settings')
})

test('saved settings survive a reload, and broken or missing values keep the default', async() => {
  const { default: config } = await import('/config.js')
  const { loadSettings, setVolume } = await import('/ui/settings.js')
  const original = config.volume
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  setVolume(2, storage)
  assert.equal(config.volume, 1, 'clamped')
  config.volume = original
  loadSettings(storage)
  assert.equal(config.volume, 1)
  config.volume = original
  values.set('partisan-games-settings', '{broken')
  loadSettings(storage)
  assert.equal(config.volume, original)
  const blocked = {
    getItem() {
      throw new Error('blocked')
    },
  }
  loadSettings(blocked)
  assert.equal(config.volume, original)
})

test('the start screen only starts, and the top button of every later screen goes back to the main menu while the bottom one carries on', () => {
  const ui = new UI(fakeScene, { intro: 'Reach the forest', onStart() {}, onContinue() {} })
  const modal = document.getElementById('modal')
  for (const [show, last] of [
    [() => ui.showPauseScreen(), 'continue'],
    [() => ui.showScreen('pause', ui.settingsScreen()), 'settings-back'],
    [() => ui.showDefeatScreen('Finished'), 'igraj-opet'],
    [() => ui.showVictoryScreen('Finished'), 'igraj-opet'],
  ]) {
    show()
    const buttons = [...modal.querySelectorAll('button')]
    assert.equal(buttons[0].id, 'menu')
    assert.equal(buttons.at(-1).id, last)
  }
  ui.renderStartScreen()
  assert.deepEqual([...modal.querySelectorAll('button')].map(button => button.id), ['start'])
  ui.end()
})
