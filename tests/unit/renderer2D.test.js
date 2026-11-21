import { test } from 'node:test'
import assert from 'node:assert/strict'
import Renderer2D from '/core/Renderer2D.js'
import Body from '/core/gameplay/bodies/Body.js'

test('a view draws itself with the context and the camera, by its layer, and a body is not drawn', () => {
  const ctx = { save() {}, restore() {}, translate() {} }
  const renderer = new Renderer2D({ canvas: { width: 800, height: 600, getContext: () => ctx } })
  renderer.cameraX = 50
  const drawn = []
  const view = (name, layer) => ({ layer, render: (context, camera) => drawn.push([name, context, camera.x, camera.width]) })
  const body = new Body()
  body.render = () => drawn.push('body')
  renderer.drawObjects([view('front', -1), body, view('back', 2)])
  assert.deepEqual(drawn, [['back', ctx, 50, 800], ['front', ctx, 50, 800]])
})
