import { test } from 'node:test'
import assert from 'node:assert/strict'

test('the crosshair is centred on the screen, where the shots go, however long the player has been moving', async t => {
  const { default: FPSRenderer } = await import('/core3d/actor/FPSRenderer.js')
  const renderer = new FPSRenderer({ weaponSrc: null })
  t.after(() => renderer.remove())
  const drawn = []
  Object.defineProperty(renderer, 'ctx', { value: { clearRect() {}, drawImage: (img, x, y) => drawn.push([x, y]) } })
  renderer.targetImg = { complete: true, naturalWidth: 32, width: 32, height: 32 }

  renderer.render(0)
  renderer.render(1.3)

  const centre = [(window.innerWidth - 32) / 2, (window.innerHeight - 32) / 2]
  assert.deepEqual(drawn, [centre, centre])
})
