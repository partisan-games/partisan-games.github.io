import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Bone, BufferGeometry, Float32BufferAttribute, Group, PerspectiveCamera, Skeleton, SkinnedMesh,
  Uint16BufferAttribute, Vector3 } from 'three'
import { createPageElements } from './helpers/dom.js'

test('the stage frames the scaled, posed skin before its first render', async() => {
  createPageElements()
  const { default: Stage3D } = await import('/storybook/Stage3D.js')
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([-50, 0, 0, 50, 0, 0, 0, 200, 0], 3))
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(12), 4))
  geometry.setAttribute('skinWeight', new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4))
  const skin = new SkinnedMesh(geometry), bone = new Bone()
  skin.add(bone)
  skin.bind(new Skeleton([bone]))
  const mesh = new Group()
  mesh.add(skin)
  mesh.scale.setScalar(.025)
  bone.position.y = 60
  for (const aspect of [16 / 9, 9 / 16]) {
    const target = new Vector3(), camera = new PerspectiveCamera(75, aspect)
    const controls = { target, update() {
      camera.lookAt(target)
      camera.updateMatrixWorld()
    } }
    Stage3D.prototype.frame.call({ camera, controls, follow() {} }, { mesh })
    assert.ok(Math.abs(target.y - 4) < .001, 'the five-metre posed mesh begins 1.5 m above the origin')
    assert.ok(camera.position.distanceTo(target) < 10, 'the camera fits the actor at world scale')
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const vertex = skin.localToWorld(skin.getVertexPosition(i, new Vector3())).project(camera)
      assert.ok(Math.abs(vertex.x) <= .58 && Math.abs(vertex.y) <= .76, 'the posed skin fits between the panels')
    }
  }
})
