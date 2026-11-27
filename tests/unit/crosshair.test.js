import { test } from 'node:test'
import assert from 'node:assert/strict'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import { iconImages } from '/core/io/icons.js'

test('aiming with the mouse, the pointer is the same sight a first-person view shows, pointing with its middle', () => {
  showCrosshair()
  assert.equal(document.body.style.cursor, `url(/assets/images/${iconImages.sight}) 16 16, crosshair`)
  hideCrosshair()
  assert.equal(document.body.style.cursor, '')
})
