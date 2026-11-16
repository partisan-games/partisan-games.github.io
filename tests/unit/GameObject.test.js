import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Bone, BoxGeometry, Float32BufferAttribute, Group, Mesh, Raycaster, Scene, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from 'three'
import GameObject from '/core3d/objects/GameObject.js'
import Actor from '/core3d/actor/Actor.js'
import Player from '/core3d/actor/Player.js'
import Input from '/core/io/Input.js'

const box = () => new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0))

test('energy is the composed health, clamped to its maximum', () => {
  const object = new GameObject({ mesh: box(), energy: 40 })
  assert.equal(object.health.maximum, 40)
  object.health.damage(15)
  assert.equal(object.energy, 25)
  object.energy = 100
  assert.equal(object.health.current, 40)
  object.energy = -10
  assert.equal(object.health.current, 0)
  assert.equal(object.dead, true)
  object.energy++
  assert.equal(object.health.current, 1)
  assert.equal(object.dead, false)
})

test('pending damage waits for the next update and multiple hits keep the last one', () => {
  const object = new GameObject({ mesh: box() })
  object.pendingDamage = 10
  object.pendingDamage = 25
  assert.equal(object.health.current, 100)
  object.update()
  assert.equal(object.health.current, 75)
  assert.equal(object.pendingDamage, 0)
  object.update()
  assert.equal(object.health.current, 75)
})

test('a blow reaches the game object that owns the hit mesh, and a mesh without an owner takes none', () => {
  const attacker = new Actor({ mesh: box(), attackDistance: 10 })
  const target = new GameObject({ mesh: box() })
  attacker.hit(target.mesh, [20, 20])
  target.update()
  assert.equal(target.health.current, 80)

  const scenery = box()
  attacker.hit(scenery, [20, 20])
  assert.deepEqual(scenery.userData, {})
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
  GameObject.ownerOf(hit.object).pendingDamage = 35
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

test('a cloned mesh does not copy its live owner', () => {
  const first = new GameObject({ mesh: box() })
  first.energy = 50
  const copy = first.mesh.clone()
  assert.equal(GameObject.ownerOf(copy), null)
  const second = new GameObject({ mesh: first.mesh, energy: 30 })
  assert.equal(second.health.current, 30)
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
