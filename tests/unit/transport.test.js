import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Texture } from 'three'
import Transport, { transport } from '/core/gameplay/bodies/aircraft/Transport.js'
import TransportSprite from '/core3d/actor/aircraft/TransportSprite.js'

const fly = (body, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) body.update(dt)
}

test('its jumpers leave it one by one over the drop zone, all of them by its end', () => {
  const plane = new Transport({ jumpers: 6, drop: { from: 100, to: 200 } })
  fly(plane, 90 / transport.speed)
  assert.equal(plane.jumped, 0)
  fly(plane, 60 / transport.speed)
  assert.ok(plane.jumped > 1 && plane.jumped < 6, `${plane.jumped}`)
  fly(plane, 100 / transport.speed)
  assert.equal(plane.jumped, 6)
  assert.ok(Math.abs(plane.x - plane.travelled) < 1e-6, 'yaw 0 flies along +x')
})

test('its nose points the way it flies across the view', () => {
  const camera = new PerspectiveCamera()
  camera.updateMatrixWorld()
  const texture = new Texture({ width: 824, height: 261 })
  const right = new TransportSprite(new Transport(), { texture, camera })
  right.body.update(.1)
  right.update()
  const left = new TransportSprite(new Transport({ yaw: Math.PI }), { texture, camera })
  left.body.update(.1)
  left.update()
  assert.equal(right.mesh.material.map.repeat.x, -1, 'mirrored, as the picture faces left')
  assert.equal(left.mesh.material.map.repeat.x, 1)
})
