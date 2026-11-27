import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'

test('the valley rises into hills only beyond the fighting, and the rivers stop the tank at their banks', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { kraljevo } = await import('/scenes/3d-tank/kraljevo.js')
  const { valley, hillHeight, buildValley } = await import('/scenes/3d-tank/valley.js')
  const { road, square, trench } = kraljevo
  // everywhere the tank and its men fight, from the road's start to beyond the square, the ground is flat
  for (let z = road.from; z <= square.z + square.radius + 20; z += 5)
    for (let x = -trench.half - 10; x <= trench.half + 10; x += 5) assert.equal(hillHeight(x, z), 0, `${x}, ${z}`)
  assert.ok(hillHeight(-valley.hills.to, 0) > hillHeight(valley.hills.to, 0), 'the Stolovi in the south rise above the Kotlenik')
  assert.ok(hillHeight(valley.ruzica.x, valley.ruzica.z) > 30, 'the Ružić hill stands behind the tank')
  // both rivers lie off the fighting
  assert.ok(valley.morava.x[0] > trench.half + 20)
  assert.ok(valley.ibar.z[0] > square.z + square.radius + 20)

  const solids = []
  buildValley({ scene: new THREE.Scene(), add: (mesh, mass) => solids.push({ mesh, mass }) })
  const walls = solids.map(({ mesh }) => new THREE.Box3().setFromObject(mesh))
  const blocked = (x, z) => walls.some(box => box.containsPoint(new THREE.Vector3(x, 1, z)))
  assert.ok(solids.every(({ mass }) => mass === 0))
  assert.ok(blocked(valley.morava.x[0] - 1, 0), 'the Morava bank by the road')
  assert.ok(blocked(0, valley.ibar.z[0] - 1), 'the Ibar bank beyond the square')
  assert.ok(!blocked(0, square.z), 'the square stays open')
})
