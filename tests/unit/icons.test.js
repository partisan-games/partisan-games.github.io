import { test } from 'node:test'
import assert from 'node:assert/strict'
import atlas from '/assets/images/sources/ui-icons/source.json' with { type: 'json' }
import { icons } from '/core/io/icons.js'

test('every icon shows its own cell of the atlas, whatever size its place gives it', () => {
  assert.deepEqual(Object.keys(icons), Object.keys(atlas.icons))
  const columns = atlas.atlas.width / atlas.cell.width, rows = atlas.atlas.height / atlas.cell.height
  const box = document.createElement('div')
  for (const [name, { x, y }] of Object.entries(atlas.icons)) {
    box.innerHTML = icons[name]
    const { style } = box.firstElementChild
    assert.equal(style.backgroundSize, `${columns * 100}% ${rows * 100}%`, name)
    // a percentage puts the same share of the picture at the same share of the box: the cell's column of the last one
    assert.equal(style.backgroundPosition, `${x / atlas.cell.width / (columns - 1) * 100}% ${y / atlas.cell.height / (rows - 1) * 100}%`, name)
    assert.match(style.backgroundImage, new RegExp(`pixel-icons\\.webp\\?v=${atlas.sha256.slice(0, 8)}`), 'a redrawn atlas is a new address')
  }
})
