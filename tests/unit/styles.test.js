import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene

before(async() => {
  createPageElements()
  Scene = (await import('/core/Scene.js')).default
})

// `paid` marks a button that costs a token, in every style
const classesOf = element => element.className.replace(/\bpaid\b/, '').replace(/\s+/g, ' ').trim()

/** Reads the classes that a scene of this style puts on its screen, score, and controls. */
function renderedClasses(uiStyle) {
  const scene = new Scene({ canvas: document.createElement('canvas'), uiStyle, intro: 'x', showControls: true })
  scene.ui.renderStartScreen()
  const screen = document.querySelector('#start-screen')
  const score = new DOMParser().parseFromString(scene.ui.scoreUI(), 'text/html').body.firstElementChild
  const controls = document.querySelector('.bottom-left')
  const classes = {
    container: classesOf(screen).replace('central-screen flex-column ', ''),
    button: classesOf(screen.querySelector('#start')),
    score: classesOf(score).replace(/^top-left ?/, ''),
    controlButton: classesOf(controls.querySelector('button')),
    controlsContent: classesOf(controls.querySelector('div')),
  }
  scene.end()
  return classes
}

test('a scene without a style uses the simple style', () => {
  const scene = new Scene({ canvas: document.createElement('canvas'), intro: 'x' })
  scene.ui.renderStartScreen()
  assert.equal(classesOf(document.querySelector('#start')), 'default-button')
  scene.end()
})

test('the next scene does not inherit the style of the previous one', () => {
  assert.deepEqual(renderedClasses('white').button, 'white-button')
  const scene = new Scene({ canvas: document.createElement('canvas'), intro: 'x' })
  scene.ui.renderStartScreen()
  assert.equal(classesOf(document.querySelector('#start')), 'default-button')
  scene.end()
})

test('the style picked in Settings wins over the style of every game, is kept, and Predefined gives each game its own', async() => {
  const { chooseUiStyle, uiStyleChoice } = await import('/ui/styles.js')
  const { readSetting } = await import('/ui/settings.js')
  try {
    chooseUiStyle('white')
    assert.equal(renderedClasses('simple').button, 'white-button')
    assert.equal(uiStyleChoice(), 'white')
    assert.equal(readSetting('uiStyle'), 'white', 'kept for the next visit')
    chooseUiStyle('rpg')
    assert.equal(uiStyleChoice(), 'white', 'the removed style is ignored')
  } finally {
    chooseUiStyle('predefined')
  }
  assert.equal(renderedClasses('simple').button, 'default-button')
  assert.equal(renderedClasses('white').button, 'white-button')
})

test('a style picked while a screen is open restyles it at once, and an ended scene no longer listens', async() => {
  const { chooseUiStyle } = await import('/ui/styles.js')
  const scene = new Scene({ canvas: document.createElement('canvas'), intro: 'x', uiStyle: 'white' })
  try {
    scene.ui.renderStartScreen()
    chooseUiStyle('simple')
    assert.equal(classesOf(document.querySelector('#start')), 'default-button')
    assert.equal(classesOf(document.querySelector('#start-screen')).replace('central-screen flex-column ', ''), 'simple-container')
  } finally {
    scene.end()
    chooseUiStyle('predefined')
  }
})
