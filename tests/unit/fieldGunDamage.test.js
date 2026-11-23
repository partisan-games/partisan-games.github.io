import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { register } from 'node:module'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import Body from '/core/gameplay/bodies/Body.js'
import World from '/core/World.js'
import FieldGunDamage from '/core3d/actor/artillery/FieldGunDamage.js'
import { createPageElements } from './helpers/dom.js'

register('./setup/ammo-node.js', import.meta.url)

async function parse(Loader, path) {
  const bytes = await readFile(path)
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  const loader = new Loader()
  return loader.parseAsync ? loader.parseAsync(buffer, '') : loader.parse(buffer, '')
}

test('the actual field gun progresses through damage to separate grounded wreck parts without editing the source', async() => {
  const { scene: source } = await parse(GLTFLoader, 'assets/models/weapon/cannon/field-gun-75.glb')
  const sourceVertices = source.getObjectByName('Barrel').geometry.attributes.position.array.slice()
  for (const fps of [30, 60]) {
    const gun = source.clone(), body = new Body(), damage = new FieldGunDamage(body, gun)
    gun.position.set(3, .7, -2)
    gun.rotation.y = .95
    const advance = seconds => {
      for (let i = 0; i < seconds * fps; i++) damage.update(1 / fps)
    }
    advance(1)
    assert.equal(damage.mesh.visible, false)
    assert.ok(damage.originals.every(({ mesh }) => mesh.visible))
    for (const phase of [1, 2, 3, 4]) {
      body.takeHit(25)
      advance(1.2)
      assert.equal(damage.phase, phase)
      assert.ok(damage.originals.every(({ mesh }) => !mesh.visible))
      assert.ok(damage.parts.every(({ mesh, base }) => mesh.material.color.getHex() !== base.getHex()))
      if (phase === 1) assert.equal(Math.abs(damage.assemblies.leftWheel.rotation.z), 0, 'light damage preserves the silhouette')
      if (phase === 2) assert.ok(Math.abs(damage.assemblies.leftWheel.rotation.z) > .1, 'half health loosens the wheel')
      if (phase === 3) assert.ok(Math.abs(damage.assemblies.leftWheel.rotation.z) > .5, 'quarter health visibly collapses the assembly')
    }
    assert.equal(body.health.current, 0)
    assert.ok(damage.assemblies.leftWheel.rotation.z < -1.4, 'the wheel lies detached instead of the whole gun merely tilting')
    assert.ok(damage.assemblies.leftWheel.position.x < -1.3)
    assert.ok(damage.assemblies.barrel.position.y < .4)
    const total = damage.parts.reduce((sum, { mesh }) => sum + mesh.geometry.attributes.position.count / 3, 0)
    assert.equal(total, 4768, 'all original triangles remain in the broken assemblies')
    gun.updateMatrixWorld(true)
    for (const part of Object.values(damage.assemblies)) {
      const bounds = new THREE.Box3().setFromObject(part, true)
      assert.ok(Math.abs(bounds.min.y - .7) < .001, `${part.name} rests on ground: ${bounds.min.y}`)
    }
    const settled = Object.values(damage.assemblies).map(part => [...part.position.toArray(), ...part.rotation.toArray()])
    advance(2)
    assert.deepEqual(Object.values(damage.assemblies).map(part => [...part.position.toArray(), ...part.rotation.toArray()]), settled)
    let disposed = 0
    damage.parts.forEach(({ mesh }) => mesh.geometry.addEventListener('dispose', () => disposed++))
    damage.end()
    assert.equal(disposed, damage.parts.length)
    assert.ok(damage.originals.every(({ mesh }) => mesh.visible))
  }
  assert.deepEqual(source.getObjectByName('Barrel').geometry.attributes.position.array, sourceVertices)
})

test('the catalog keeps the gun crew independent through damage, destruction and Reset', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  for (const Loader of [GLTFLoader, FBXLoader]) t.mock.method(Loader.prototype, 'loadAsync', url =>
    parse(Loader, new URL(`../..${url}`, import.meta.url)))
  const { artillery } = await import('/catalog/stories/objects3d.js')
  const story = artillery.find(story => story.id === 'poljski-top-3d')
  const stage = () => ({ scene: new THREE.Scene(), world: new World(), add(...objects) {
    this.world.add(...objects)
    this.scene.add(...objects.filter(object => object.mesh).map(object => object.mesh))
  } })
  const preview = stage(), body = await story.create(preview)
  const drill = preview.world.objects.find(object => object.crew)
  const model = preview.world.objects.find(object => object.body === body)
  const advance = () => {
    for (let i = 0; i < 90; i++) preview.world.update(1 / 60, i / 60)
  }
  body.takeHit(50)
  advance()
  assert.ok(model.mesh.getObjectByName('FieldGunDamage').visible)
  assert.ok(drill.crew.members.every(member => member.health.alive && member.mesh.parent === model.mesh))
  body.setState('dead')
  advance()
  assert.ok(drill.crew.members.every(member => member.health.alive && member.mesh.parent === preview.scene))
  assert.equal(model.mesh.rotation.z, 0, 'the generic whole-vehicle tilt is replaced by the gun-specific wreck')
  assert.ok(model.mesh.getObjectByName('leftWheel').rotation.z < -1.4)
  preview.world.end()
  const reset = stage(), fresh = await story.create(reset)
  assert.equal(fresh.health.current, fresh.health.maximum)
  assert.equal(reset.world.objects.find(object => object.body === fresh).mesh.getObjectByName('FieldGunDamage').visible, false)
  reset.world.end()
})
