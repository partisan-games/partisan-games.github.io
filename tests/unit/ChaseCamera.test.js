import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, PerspectiveCamera } from 'three'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'

test('on long frames a fast camera stops at its target instead of swinging past it', () => {
  const mesh = new Mesh()
  const camera = new PerspectiveCamera()
  // the warplane camera: speed 30, no rotation, right behind the plane
  const chaseCamera = new ChaseCamera({ camera, mesh, speed: 30, rotate: false, offset: [0, 0, 5], lookAt: [0, 0, 0] })

  const positions = []
  for (let frame = 0; frame < 5; frame++) {
    mesh.position.x = 10
    chaseCamera.update(1 / 10) // 10 fps
    positions.push(camera.position.x)
  }
  assert.deepEqual(positions, [10, 10, 10, 10, 10])
})

test('on normal frames the camera still follows smoothly', () => {
  const mesh = new Mesh()
  const camera = new PerspectiveCamera()
  const chaseCamera = new ChaseCamera({ camera, mesh, speed: 30, rotate: false, offset: [0, 0, 5], lookAt: [0, 0, 0] })

  mesh.position.x = 10
  chaseCamera.update(1 / 60)
  assert.equal(camera.position.x, 5)
})
