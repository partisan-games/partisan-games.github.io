import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import { iconImages } from '/core/io/icons.js'

test('aiming with the mouse, the pointer is the same sight a first-person view shows, pointing with its middle', async() => {
  const png = await readFile(`assets/images/${iconImages.sight}`)
  const x = png.readUInt32BE(16) / 2, y = png.readUInt32BE(20) / 2
  showCrosshair()
  assert.equal(document.body.style.cursor, `url(/assets/images/${iconImages.sight}) ${x} ${y}, crosshair`)
  hideCrosshair()
  assert.equal(document.body.style.cursor, '')
})
