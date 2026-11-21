import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import renderBatina from '/scenes/tenkici/renderLayers.js'

const layout = JSON.parse(readFileSync(new URL('../../assets/images/background/batina-1944/layout.json', import.meta.url), 'utf8'))
const images = { base: 'base', clouds: 'clouds', actors: 'actors' }
function render(time, options) {
  const calls = []
  const ctx = {
    save() {}, restore() {}, createLinearGradient() {
      return { addColorStop() {} }
    },
    fillRect() {}, drawImage(...args) {
      calls.push(args)
    },
  }
  renderBatina(ctx, images, layout, time, options)
  return calls
}

test('the same scene time holds the entire composition; later time changes each ambient clip without moving its anchor', () => {
  const first = render(0), moved = render(1.1)
  assert.deepEqual(render(1.1), moved)
  const sprites = calls => calls.filter(args => args[0] === images.actors)
  assert.equal(sprites(first).length, 4)
  sprites(first).forEach((call, i) => {
    if (layout.actors[i].gestures) assert.equal(call[1], sprites(moved)[i][1], 'civilians rest rather than cycling continuously')
    else assert.notEqual(call[1], sprites(moved)[i][1], layout.actors[i].id + ' changes its source phase')
    assert.deepEqual(call.slice(5), sprites(moved)[i].slice(5), 'destination anchor stays fixed')
  })
})

test('civilians make occasional gestures separated by long irregular rests', () => {
  const samples = Array.from({ length: 720 }, (_, i) => {
    const calls = render(i / 10).filter(call => call[0] === images.actors)
    return calls[3][1]
  })
  assert.ok(samples.filter(frame => frame === 0).length > samples.length * .85)
  assert.ok(new Set(samples).size > 1, 'there are actual gestures')
  const starts = samples.flatMap((frame, i) => frame !== 0 && (i === 0 || samples[i - 1] === 0) ? [i] : [])
  assert.ok(starts.length >= 3 && starts.length <= 4)
  const gaps = starts.slice(1).map((start, i) => start - starts[i])
  assert.ok(new Set(gaps).size > 1, 'the pauses do not repeat at a fixed interval')
})

test('clouds move behind the environment; observers remain behind their foreground sandbags', () => {
  const first = render(0), moved = render(1.1)
  assert.equal(first[0][0], images.clouds)
  assert.equal(first[2][0], images.base)
  assert.notEqual(first[0][1], moved[0][1])
  const sprites = moved.map((call, i) => call[0] === images.actors ? i : -1).filter(i => i >= 0)
  for (const i of [1, 2]) {
    const mask = moved[sprites[i] + 1]
    assert.equal(mask[0], images.base)
    assert.deepEqual(mask.slice(1, 5), layout.actors[i].occlusion[0])
  }
})

test('the environment can be viewed alone without clouds or ambient characters', () => {
  assert.deepEqual(render(10, { actors: false, clouds: false }), [[images.base, 0, 0, 1536, 1024]])
})
