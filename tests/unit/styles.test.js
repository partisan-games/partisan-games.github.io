import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scena

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
})

// the classes each style gave its elements before the styles moved to one place
const recorded = {
  simple: { container: 'simple-container', button: 'default-button', score: '', controlButton: '' },
  rpg: { container: 'rpgui-container framed', button: 'rpgui-button', score: 'rpgui-button golden', controlButton: 'rpgui-button' },
  white: { container: 'white-container', button: 'white-button', score: '', controlButton: 'white-button' },
}

const classesOf = element => element.className.replace(/\s+/g, ' ').trim()

/** Reads the classes that a scene of this style puts on its screen, score, and controls. */
function renderedClasses(uiStyle) {
  const scene = new Scena({ canvas: document.createElement('canvas'), uiStyle, intro: 'x', showControls: true })
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

for (const [style, expected] of Object.entries(recorded))
  test(`the ${style} style gives the start screen, score and controls the same classes as before`, () => {
    const { controlsContent, ...classes } = renderedClasses(style)
    assert.deepEqual(classes, expected)
    assert.equal(controlsContent, expected.container)
  })

test('a scene without a style uses the simple style', () => {
  const scene = new Scena({ canvas: document.createElement('canvas'), intro: 'x' })
  scene.ui.renderStartScreen()
  assert.equal(classesOf(document.querySelector('#start')), 'default-button')
  scene.end()
})

test('the next scene does not inherit the style of the previous one', () => {
  renderedClasses('rpg')
  assert.deepEqual(renderedClasses('white').button, 'white-button')
  const scene = new Scena({ canvas: document.createElement('canvas'), intro: 'x' })
  scene.ui.renderStartScreen()
  assert.equal(classesOf(document.querySelector('#start')), 'default-button')
  scene.end()
})
