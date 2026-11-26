import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

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

for (const [id, marking] of [['otpisani-strelac', 'rifleman'], ['otpisani-strazar', 'sentry']])
  test(`the redrawn ${marking} reads all six action rows inside the atlas margins`, () => checkActionRows(id, marking))

async function checkActionRows(id, marking) {
  const { sideProjection } = await import('/core/actor/projection.js')
  const story = stories.find(candidate => candidate.id === id)
  let view
  const stage = {
    width: 800, height: 600, cameraX: 0, cameraY: 0,
    projection: sideProjection({ pxPerMeter: 100, groundY: 500 }),
    add(_, sprite) {
      view = sprite
    },
  }
  const body = story.create(stage, story.way)
  loadAtlas(view.clip, 2080, 3120)
  assert.ok(view.clip.image.src.endsWith(`/otpisani-${marking}-pixel-sprites.webp`))
  assert.equal(view.height, 180)
  const draws = []
  const ctx = { save() {}, restore() {}, translate() {}, scale() {}, drawImage: (...args) => draws.push(args) }
  const assertRow = row => {
    view.render(ctx)
    const [image, x, y, width, height] = draws.pop()
    assert.equal(image, view.clip.image)
    assert.deepEqual([x, y, width, height], [4, row * 520 + 4, 512, 512])
  }
  assertRow(0)
  body.setState('move')
  body.yaw = Math.PI
  assertRow(1)
  body.yaw = 0
  assertRow(2)
  body.setState('attack')
  assertRow(3)
  view.hitTime = 0
  assertRow(4)
  body.setState('dead')
  assertRow(5)
}
