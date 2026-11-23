import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import optimizeFigure from '/scenes/cannon/optimizeFigure.js'

const triangles = geometry => {
  const result = []
  for (const group of geometry.groups) for (let i = group.start; i < group.start + group.count; i += 3) {
    const vertices = [0, 1, 2].map(n => geometry.index ? geometry.index.getX(i + n) : i + n)
    result.push([group.materialIndex, ...vertices].join(':'))
  }
  return result.sort()
}

test('the actual low-poly soldier drops from 1423 to 10 groups with identical triangles, skinning and source data', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const bytes = await readFile('assets/models/character/soldier/partisan-lowpoly.fbx')
  const source = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  const original = source.getObjectByName('Partisan').geometry
  const sourceGroups = structuredClone(original.groups)
  const figure = clone(source), meshes = []
  figure.traverse(part => {
    if (part.isSkinnedMesh) meshes.push(part)
  })
  const count = () => meshes.reduce((sum, mesh) => sum + mesh.geometry.groups.length, 0)
  const before = meshes.map(mesh => ({ geometry: mesh.geometry, faces: triangles(mesh.geometry), skeleton: mesh.skeleton }))
  assert.equal(count(), 1423)
  const elbow = figure.getObjectByName('mixamorigLeftForeArm')
  elbow.rotateZ(.2)
  figure.updateMatrixWorld(true)
  meshes.forEach(mesh => mesh.skeleton.update())
  const sample = () => meshes.map(mesh => [0, 10, 30].map(i => mesh.getVertexPosition(i, new THREE.Vector3()).toArray()))
  const pose = sample()
  optimizeFigure(figure)
  assert.equal(count(), 10)
  assert.deepEqual(sample(), pose, 'a posed skeleton still deforms the same vertices')
  meshes.forEach((mesh, i) => {
    assert.equal(mesh.skeleton, before[i].skeleton)
    assert.deepEqual(triangles(mesh.geometry), before[i].faces, 'every triangle keeps its material and winding')
    for (const [name, attribute] of Object.entries(before[i].geometry.attributes))
      assert.deepEqual(mesh.geometry.attributes[name].array, attribute.array, name)
  })
  assert.deepEqual(original.groups, sourceGroups)
  assert.equal(original.index, null)
  const second = clone(source)
  optimizeFigure(second)
  assert.equal(second.getObjectByName('Partisan').geometry, figure.getObjectByName('Partisan').geometry,
    'instances share one optimized geometry instead of building copies for every soldier')
})

test('transparent material order and partial draw ranges are left unchanged', () => {
  for (const transparent of [true, false]) {
    const geometry = new THREE.BoxGeometry().toNonIndexed()
    const material = new THREE.MeshBasicMaterial({ transparent })
    const mesh = new THREE.Mesh(geometry, [material])
    if (!transparent) geometry.setDrawRange(0, 3)
    const groups = structuredClone(geometry.groups)
    optimizeFigure(mesh)
    assert.equal(mesh.geometry, geometry)
    assert.deepEqual(mesh.geometry.groups, groups)
  }
})
