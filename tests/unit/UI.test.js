import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let UI
const fakeScene = { gameLoop: { isPaused: false }, sceneUI: () => '' }

before(async() => {
  createPageElements()
  UI = (await import('/ui/UI.js')).default
})

test('end removes the full screen button it added', () => {
  const ui = new UI(fakeScene)
  assert.equal(document.querySelectorAll('full-screen-btn').length, 1)

  ui.end()
  assert.equal(document.querySelectorAll('full-screen-btn').length, 0)
})

test('switching games keeps a single full screen button', () => {
  for (let i = 0; i < 3; i++) new UI(fakeScene).end()
  const last = new UI(fakeScene)

  assert.equal(document.querySelectorAll('full-screen-btn').length, 1)
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
  ui.render()

  ui.showMessage('you are burning')
  assert.match(document.getElementById('modal').textContent, /burned/)
  assert.doesNotMatch(document.getElementById('modal').textContent, /you are burning/)
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
  const pausedScene = { gameLoop: { isPaused: true }, sceneUI: () => '' }
  const ui = new UI(pausedScene)
  ui.render()

  ui.showMessage('Click to morph city')
  assert.match(document.getElementById('modal').textContent, /Game paused/)
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
  await new Promise(resolve => {
    setTimeout(resolve, 10) // each report adds its paper to the container a moment later
  })
  container.remove()
})

