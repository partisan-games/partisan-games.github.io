import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

test('an occupier loops the new fire row and keeps his flash on each measured muzzle, from either side', async t => {
  createPageElements()
  loadImages(t, { 'occupier-sprites.png': [1050, 1260], 'pucanje.png': [19, 21] })
  const { default: Occupier } = await import('/core/gameplay/bodies/soldiers/Occupier.js')
  const { default: OccupierSprite } = await import('/core/actor/soldiers/OccupierSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const metadata = JSON.parse(await readFile(new URL('../../assets/images/armies/sources/infantry-art/occupier-sprites.json', import.meta.url), 'utf8'))
  const fire = metadata.assets[0].animations.find(clip => clip.name === 'fire')
  for (const yaw of [0, Math.PI]) {
    const body = new Occupier({ x: 5, y: .9, yaw })
    const view = new OccupierSprite(body, { projection: sideProjection({ pxPerMeter: 100, groundY: 600 }) })
    await null
    body.setState('fire')
    for (const seconds of [.001, .101, .201, .301, .401, .501, .601, 1.201, 1000.301]) {
      body.stateTime = seconds
      view.update(0)
      const drawn = {}
      view.render({ drawImage: (image, ...rest) => {
        if (image === view.flash) drawn.flash = { x: rest[0] + image.naturalWidth / 2, y: rest[1] + image.naturalHeight / 2 }
        else drawn.source = rest.slice(0, 4)
      } })
      const frame = Math.floor(seconds * 10) % 5
      assert.deepEqual(drawn.source, [frame * 210, 1050, 210, 210], 'loop the sixth row without holding its last frame')
      assert.deepEqual(drawn.flash, { x: view.x - 105 + fire.muzzle[frame].x, y: view.y - 105 + fire.muzzle[frame].y })
      assert.equal(body.vx, 0)
      assert.equal(view.flipY, 1, 'the frontal pose is identical from either walking direction')
    }
  }
})

test('the occupier still walks in either direction and holds the final death frame without a flash', async t => {
  createPageElements()
  loadImages(t, { 'occupier-sprites.png': [1050, 1260], 'pucanje.png': [19, 21] })
  const { default: Occupier } = await import('/core/gameplay/bodies/soldiers/Occupier.js')
  const { default: OccupierSprite } = await import('/core/actor/soldiers/OccupierSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  for (const yaw of [0, Math.PI]) {
    const body = new Occupier({ x: 5, y: .9, yaw })
    const view = new OccupierSprite(body, { projection: sideProjection({ pxPerMeter: 100, groundY: 600 }) })
    await null
    for (const state of ['walk', 'dead']) {
      body.setState(state)
      body.stateTime = 20.401
      view.update(0)
      const draws = []
      view.render({ drawImage: (image, ...rest) => draws.push({ image, source: rest.slice(0, 4) }) })
      assert.equal(draws.length, 1, 'walking and death never draw a flash')
      assert.deepEqual(draws[0].source, [840, state === 'dead' ? 840 : yaw === 0 ? 630 : 420, 210, 210])
    }
  }
})
