import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

test('a firing occupier turns to the viewer once and then stands still, his flash on his gun', async t => {
  createPageElements()
  loadImages(t, { 'occupier-sprites.png': [1050, 1260], 'pucanje.png': [19, 21] })
  const { default: Occupier } = await import('/core/gameplay/bodies/soldiers/Occupier.js')
  const { default: OccupierSprite } = await import('/core/actor/soldiers/OccupierSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const body = new Occupier({ x: 5, y: .9 })
  const view = new OccupierSprite(body, { projection: sideProjection({ pxPerMeter: 100, groundY: 600 }) })
  await null
  body.setState('fire')
  /** The part of the atlas he is drawn from at `seconds` of firing, and the middle of the flash from his middle. */
  const drawnAt = seconds => {
    body.stateTime = seconds
    view.update(0)
    const drawn = {}
    view.render({ drawImage: (image, ...rest) => {
      if (image === view.flash) drawn.flash = { x: rest[0] + image.naturalWidth / 2 - view.x, y: rest[1] + image.naturalHeight / 2 - view.y }
      else drawn.frame = rest.slice(0, 2)
    } })
    return drawn
  }
  const standing = [.6, .7, .8, .9, 2].map(drawnAt)
  for (const { frame, flash } of standing) {
    assert.deepEqual(frame, standing[0].frame, 'the same picture, without a jerk')
    assert.ok(flash.y < -10, `the flash on the gun at his chest, not lower: ${flash.y}`)
  }
})
