import { test } from 'node:test'
import assert from 'node:assert/strict'
import SceneryLayer from '/core/SceneryLayer.js'

const catalog = {
  blood: { src: 'blood.png', width: 40, height: 20, anchor: { x: 20, y: 15 }, layer: 0 },
  soldier: { src: 'soldier.png', width: 100, height: 40, anchor: { x: 50, y: 35 }, layer: 1 },
}
const image = () => Object.assign(new EventTarget(), { complete: true, naturalWidth: 100 })

test('only selected props load; repeated placements and moving a prop share one image', async() => {
  const created = []
  const layer = new SceneryLayer([], { catalog, createImage: src => { created.push(src); return image() } })
  assert.equal(created.length, 0)
  const one = { id: 'soldier', x: 10, y: 20 }, two = { id: 'soldier', x: 50, y: 70 }
  await layer.setItems([one, two])
  assert.deepEqual(created, ['/assets/images/soldier.png'])
  one.x = 150
  await layer.setItems([one])
  assert.equal(created.length, 1)
  assert.equal(layer.items[0].x, 150)
})

test('blood draws below bodies, depth orders bodies, and flipping keeps the placement anchor fixed', async() => {
  const layer = new SceneryLayer([
    { id: 'soldier', x: 90, y: 80, scale: 2, flip: true },
    { id: 'blood', x: 90, y: 100 },
    { id: 'soldier', x: 20, y: 30 },
  ], { catalog, createImage: image })
  await layer.ready
  const calls = []
  layer.render({ save() {}, restore() {},
    translate: (...args) => calls.push(['position', ...args]),
    scale: (...args) => calls.push(['scale', ...args]),
    drawImage: (image, ...args) => calls.push(['draw', ...args]),
  })
  assert.deepEqual(calls.filter(call => call[0] === 'position'), [
    ['position', 90, 100], ['position', 20, 30], ['position', 90, 80],
  ])
  assert.deepEqual(calls.slice(-3), [
    ['position', 90, 80], ['scale', -2, 2], ['draw', -50, -35, 100, 40],
  ])
})

test('readiness waits for every selected image and forwards image failures', async() => {
  const images = []
  const layer = new SceneryLayer([{ id: 'soldier', x: 1, y: 2 }, { id: 'blood', x: 1, y: 2 }], {
    catalog, createImage: () => {
      const pending = Object.assign(new EventTarget(), { complete: false, naturalWidth: 0 })
      images.push(pending)
      return pending
    },
  })
  let ready = false
  const failed = assert.rejects(layer.ready.then(() => { ready = true }), /Image could not be loaded/)
  images[0].complete = true
  images[0].naturalWidth = 100
  images[0].dispatchEvent(new Event('load'))
  await Promise.resolve()
  assert.equal(ready, false)
  images[1].dispatchEvent(new Event('error'))
  await failed
})

test('an invalid replacement leaves the existing placement list intact', async() => {
  const first = [{ id: 'soldier', x: 10, y: 20 }]
  const layer = new SceneryLayer(first, { catalog, createImage: image })
  await layer.ready
  assert.throws(() => layer.setItems([{ id: 'missing', x: 0, y: 0 }]), /Unknown scenery/)
  assert.throws(() => layer.setItems([{ id: 'soldier', x: 0, y: 0, scale: -1 }]), /Invalid scenery/)
  assert.equal(layer.items, first)
})
