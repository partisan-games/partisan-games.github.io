import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let stories
before(async() => {
  createPageElements()
  ;({ soldiers: stories } = await import('/catalog/stories/otpisani.js'))
})

test('the remaining enemy candidates remain individually selectable', () => {
  const ids = ['otpisani-strelac', 'otpisani-strazar']
  const selected = ids.map(id => stories.find(story => story.id === id))
  assert.ok(selected.every(Boolean))
  assert.equal(new Set(selected).size, 2)
  assert.ok(selected.every(story => !story.looks), 'distinct roles must not be hidden under skins')
})
