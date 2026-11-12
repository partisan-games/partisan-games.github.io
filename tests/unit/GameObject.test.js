import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Bone, BoxGeometry, Float32BufferAttribute, Group, Mesh, Raycaster, Scene, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from 'three'
import GameObject from '/core3d/objects/GameObject.js'
import Actor from '/core3d/actor/Actor.js'
import Player from '/core3d/actor/Player.js'
import Input from '/core/io/Input.js'

const box = () => new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0))

test('legacy energy and the composed health read and write a single state', () => {
  const object = new GameObject({ mesh: box(), energy: 40 })
  assert.equal(object.health.maximum, 40)
  object.mesh.userData.energy = 25
  assert.equal(object.energy, 25)
  assert.equal(object.health.current, 25)
  object.health.damage(5)
  assert.equal(object.mesh.userData.energy, 20)
  object.energy = 100
  assert.equal(object.health.current, 40)
  object.mesh.userData.energy = -10
  assert.equal(object.health.current, 0)
  assert.equal(object.dead, true)
  object.energy++
  assert.equal(object.health.current, 1)
  assert.equal(object.dead, false)
  object.mesh.userData.energy = Infinity
  assert.equal(object.health.current, 40)
})

test('legacy queued damage remains deferred and multiple writes keep the last hit', () => {
  const object = new GameObject({ mesh: box() })
  object.mesh.userData.damageAmount = 10
  object.damageAmount = 25
  assert.equal(object.mesh.userData.damageAmount, 25)
  assert.equal(object.health.current, 100)
  object.update()
  assert.equal(object.health.current, 75)
  assert.equal(object.damageAmount, 0)
  assert.equal(object.mesh.userData.damageAmount, 0)
  object.update()
  assert.equal(object.health.current, 75)
})

test('the old mesh-only attack can hit a composed target and a legacy target', () => {
  const attacker = new Actor({ mesh: box(), attackDistance: 10 })
  const composed = new GameObject({ mesh: box() })
  attacker.hit(composed.mesh, [20, 20])
  composed.update()
  assert.equal(composed.health.current, 80)

  const legacy = box()
  legacy.userData = { energy: 100, damageAmount: 0 }
  attacker.hit(legacy, [20, 20])
  assert.equal(legacy.userData.damageAmount, 20)
  assert.equal(legacy.userData.energy, 100)
  assert.equal(GameObject.ownerOf(legacy), null)
})

test('raycast hits on a cloned skinned child resolve to its owning game object', () => {
  const geometry = new BoxGeometry(1, 2, 1).translate(0, 1, 0)
  const { count } = geometry.attributes.position
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4))
  const weights = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) weights[i * 4] = 1
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4))
  const child = new SkinnedMesh(geometry)
  const bone = new Bone()
  bone.name = 'root-bone'
  child.add(bone)
  child.bind(new Skeleton([bone]))
  const model = new Group()
  model.add(child)
  model.userData.animations = []
  const object = new GameObject({ mesh: model })
  object.mesh.updateMatrixWorld(true)
  const [hit] = new Raycaster(new Vector3(0, 1, 5), new Vector3(0, 0, -1)).intersectObject(object.mesh, true)
  assert.ok(hit)
  assert.equal(GameObject.ownerOf(hit.object), object)
  assert.equal(GameObject.ownerOf(object.mesh.getObjectByName('root-bone')), object)
  GameObject.ownerOf(hit.object).damageAmount = 35
  object.update()
  assert.equal(object.health.current, 65)
})

test('owners stay distinct for clones and the closest nested object owns its children', () => {
  const template = new Group()
  template.add(box())
  const first = new GameObject({ mesh: template })
  const second = new GameObject({ mesh: template })
  first.mesh.add(second.mesh)
  assert.equal(GameObject.ownerOf(first.mesh.children[0]), first)
  assert.equal(GameObject.ownerOf(second.mesh.children[0]), second)
  assert.equal(GameObject.ownerOf(template.children[0]), null)
  assert.equal(GameObject.ownerOf(null), null)
})

test('cloning a bound mesh copies numeric legacy data without copying a live owner', () => {
  const first = new GameObject({ mesh: box() })
  first.energy = 50
  const copy = first.mesh.clone()
  assert.equal(copy.userData.energy, 50)
  assert.equal(GameObject.ownerOf(copy), null)
  copy.userData.energy = 10
  assert.equal(first.energy, 50)
  const second = new GameObject({ mesh: first.mesh, energy: 30 })
  assert.equal(second.health.current, 30)
  assert.equal(second.mesh.userData.energy, 30)
  assert.equal(first.health.current, 50)
})

test('health pickups keep their remaining supply and the player HUD follows composed health', t => {
  const player = new Player({
    mesh: box(), energy: 100, showHealthBar: true,
    input: new Input({ useKeyboard: false, useJoystick: false }),
  })
  t.after(() => player.end())
  const pickup = new GameObject({ mesh: box(), name: 'health', energy: 2 })
  const scene = new Scene()
  scene.add(player.mesh, pickup.mesh)
  player.energy = 98
  player.checkHealths()
  player.updateHealthBar()
  assert.equal(player.health.current, 99)
  assert.equal(player.healthBar.value, 99)
  assert.equal(player.healthBar.max, 100)
  assert.equal(pickup.health.current, 1)
  player.checkHealths()
  assert.equal(player.health.current, 100)
  assert.equal(pickup.health.current, 0)
})

test('a color given to one object of a model leaves the other objects of that model their own color', () => {
  const model = box()
  model.material.color.setHex(0xffffff)

  const red = new GameObject({ mesh: model, color: 0xff0000 })
  const plain = new GameObject({ mesh: model })

  assert.equal(red.mesh.material.color.getHex(), 0xff0000)
  assert.equal(plain.mesh.material.color.getHex(), 0xffffff)
  assert.equal(model.material.color.getHex(), 0xffffff)
})
