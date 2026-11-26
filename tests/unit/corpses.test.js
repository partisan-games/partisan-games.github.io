import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import Corpses from '/core3d/actor/Corpses.js'

/** A man of two bones, the upper bent at the hip, as a skinned box with a rifle in his hand, lying at `x`. */
function fallen(x, materials) {
  const geometry = new THREE.BoxGeometry(.4, 1.8, .3, 1, 4, 1).translate(0, .9, 0)
  const { count } = geometry.attributes.position
  const index = [], weight = []
  for (let i = 0; i < count; i++) {
    index.push(geometry.attributes.position.getY(i) > .9 ? 1 : 0, 0, 0, 0)
    weight.push(1, 0, 0, 0)
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(index, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weight, 4))
  const hip = new THREE.Bone(), chest = new THREE.Bone()
  chest.position.y = .9
  hip.add(chest)
  const body = new THREE.SkinnedMesh(geometry, materials.cloth)
  body.add(hip)
  body.bind(new THREE.Skeleton([hip, chest]))
  chest.rotation.z = Math.PI / 2
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(1, .1, .1), materials.wood)
  chest.add(rifle)
  const figure = new THREE.Group().add(body)
  figure.position.x = x
  figure.rotation.y = .7
  return { figure, body }
}

test('the dead are drawn as they fell, in a few shared meshes, one for each material, stretch of ground and batch of men', () => {
  const materials = { cloth: new THREE.MeshLambertMaterial(), wood: new THREE.MeshLambertMaterial() }
  const corpses = new Corpses()
  const { figure, body } = fallen(5, materials)
  figure.updateMatrixWorld(true)
  const seen = Array.from({ length: body.geometry.attributes.position.count },
    (_, i) => body.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(body.matrixWorld))
  corpses.add(figure)
  const [[cloth]] = [...corpses.batches.values()]
  const baked = cloth.mesh.geometry.attributes.position
  assert.equal(baked.count, seen.length)
  for (let i = 0; i < baked.count; i++)
    assert.ok(seen.some(point => point.distanceTo(new THREE.Vector3().fromBufferAttribute(baked, i)) < 1e-5), `vertex ${i} as it lay`)
  assert.equal(cloth.mesh.geometry.attributes.skinIndex, undefined, 'no bones left to move')

  // thirty more within one stretch of ground, then two far apart
  corpses.add(...Array.from({ length: 30 }, (_, i) => fallen(5 + i * .3, materials).figure))
  assert.equal(corpses.draws, 4, 'thirty-one men of two materials in batches of 24')
  corpses.add(fallen(100, materials).figure, fallen(-100, materials).figure)
  assert.equal(corpses.draws, 8, 'the far ones each in their own stretch, which is not drawn while out of sight')
  corpses.end()
  assert.equal(corpses.draws, 0)
})
