import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

// happy-dom has no 2D canvas; the flags draw on the shared context, which is taken when canvas2d.js loads.
const canvasContext = { save() {}, restore() {}, scale() {}, drawImage() {}, imageSmoothingEnabled: true }

before(() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => canvasContext)
})

test('flags share a wave, face the battlefield and keep their cloth inside the screen', async t => {
  const Flag = (await import('/core/actor/soldiers/Flag.js')).default
  const { ctx } = await import('/core/io/canvas2d.js')
  const clock = { time: .25 }
  const flags = [
    new Flag({ x: 59, y: 400, getTime: () => clock.time }),
    new Flag({ x: 1181, y: 400, italian: true, getTime: () => clock.time }),
  ]
  flags.forEach((flag, i) => {
    flag.animation = {}
    flag.animationElapsed = i * .7
    flag.image = { naturalWidth: 488, naturalHeight: 76 }
  })
  const directions = []
  const draws = []
  t.mock.method(ctx, 'scale', x => directions.push(x))
  t.mock.method(ctx, 'drawImage', (...args) => draws.push(args))
  for (const time of [.25, .6]) {
    clock.time = time
    draws.length = directions.length = 0
    flags.forEach(flag => flag.drawFrame())
    assert.deepEqual(directions, [1, -1])
    const middle = draws.length / 2
    assert.deepEqual(draws.slice(0, middle).map(args => args.slice(5)),
      draws.slice(middle).map(args => args.slice(5)), 'both cloths use identical deformations')
    assert.equal(draws[0][1], 0, 'the partisan cloth does not also cycle through baked animation frames')
    flags.forEach((flag, i) => {
      for (const draw of draws.slice(i * middle, (i + 1) * middle)) {
        const x = flag.x + directions[i] * draw[5]
        const end = x + directions[i] * draw[7]
        assert.ok(Math.min(x, end) >= 0 && Math.max(x, end) <= 1280)
      }
    })
  }
})
