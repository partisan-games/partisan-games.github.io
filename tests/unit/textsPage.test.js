import { test } from 'node:test'
import assert from 'node:assert/strict'
import { texts } from '/scenes/texts.js'

const leaves = group => Object.values(group).flatMap(value => value && typeof value === 'object' ? leaves(value) : [value])

test('the texts page lists every text of every game, a text made in play as its template', async t => {
  t.mock.method(globalThis, 'fetch', async() => {
    throw new Error('no server in the test')
  })
  const { default: renderTexts } = await import('/pages/texts.js')
  const root = document.createElement('div')
  await renderTexts(root)
  assert.equal(root.querySelectorAll('section').length, Object.keys(texts).length)
  assert.equal(root.querySelectorAll('dd').length, leaves(texts).length)
  assert.ok([...root.querySelectorAll('dd.template')].some(dd => dd.textContent === 'Player ${player}\'s turn'))
})
