import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { createStoryDetails } from '/catalog/storyDetails.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'

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

test('the greatcoat has a visible winter-only restriction backed by shared metadata', () => {
  const sentry = stories.find(story => story.id === 'otpisani-strazar')
  assert.deepEqual(enemyKinds.sentry.allowedSeasons, ['winter'])
  assert.strictEqual(sentry.allowedSeasons, enemyKinds.sentry.allowedSeasons)
  const text = createStoryDetails(sentry).textContent
  assert.match(text, /Zimska uniforma/)
  for (const season of ['proleće', 'leto', 'jesen']) assert.ok(text.includes(season))
  for (const id of ['otpisani-strelac'])
    assert.doesNotMatch(createStoryDetails(stories.find(story => story.id === id)).textContent, /Zimska uniforma/)
})
