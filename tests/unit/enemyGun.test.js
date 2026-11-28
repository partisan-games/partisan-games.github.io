import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'

let EnemyGun, enemyGun
before(async() => {
  ;({ default: EnemyGun, enemyGun } = await import('/core3d/actor/artillery/EnemyGun.js'))
})

/** A tank target at `z` metres down the road from a gun at the origin, and the walls between them. */
function range(z, walls = []) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 6))
  let taken = 0
  const target = { x: 0, y: 1, z, mesh, alive: true, takeHit: damage => {
    taken += damage
  } }
  const clock = new GameClock()
  const gun = new EnemyGun({ x: 0, z: 0, target, world: { rigidBodies: [mesh, ...walls] }, clock, random: () => 0 })
  return { gun, target, clock, taken: () => taken }
}

const wait = (clock, seconds) => clock.advance(seconds)

test('a German gun turns to the tank in reach and hits it each time it has reloaded, not before its first shot', () => {
  const { gun, clock, taken } = range(40)
  gun.update()
  assert.equal(gun.shotsFired, 0, 'not before its first shot')
  wait(clock, enemyGun.firstShot)
  gun.update()
  assert.equal(taken(), enemyGun.damage)
  assert.ok(Math.abs(gun.yaw) < 1e-9, 'turned down the road to it')
  gun.update()
  assert.equal(gun.shotsFired, 1, 'once per reload')
  wait(clock, enemyGun.interval)
  gun.update()
  assert.equal(taken(), enemyGun.damage * 2)
})

test('it holds fire beyond its reach, and a wall in the way takes its shell', () => {
  const far = range(enemyGun.reach + 5)
  wait(far.clock, enemyGun.firstShot)
  far.gun.update()
  assert.equal(far.gun.shotsFired, 0)

  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1))
  wall.position.z = 20
  const blocked = range(40, [wall])
  wait(blocked.clock, enemyGun.firstShot)
  blocked.gun.update()
  assert.equal(blocked.taken(), 0)
  assert.ok(Math.abs(blocked.gun.lastBlast.z - 19.5) < .01, 'it bursts on the wall')
})

test('a shell of the tank takes its health, and a destroyed gun fires no more', () => {
  const { gun, clock } = range(40)
  gun.takeHit(enemyGun.health)
  assert.ok(gun.dead)
  wait(clock, enemyGun.firstShot)
  gun.update()
  assert.equal(gun.shotsFired, 0)
})

test('told to hold fire it does not fire, told to fire it does, and destroyed at once it stays so', () => {
  const { gun, clock } = range(40)
  wait(clock, enemyGun.firstShot)
  gun.setState('idle')
  gun.update()
  assert.equal(gun.shotsFired, 0)
  gun.setState('attack')
  gun.update()
  assert.equal(gun.shotsFired, 1)
  gun.setState('dead')
  assert.equal(gun.state, 'dead')
  gun.setState('attack')
  assert.equal(gun.state, 'dead', 'a destroyed gun stays so')
})

test('the catalog crew loads and reacts, and the gun keeps its damage and cold wreck states', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, done) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => done?.(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, done) => {
    queueMicrotask(() => done({ width: 128, height: 128 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async file => {
    const data = await readFile(file.slice(1))
    return new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
  })
  t.mock.method(FBXLoader.prototype, 'loadAsync', async file => {
    const data = await readFile(decodeURI(file.slice(1)))
    return new FBXLoader().parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
  })
  const { artillery } = await import('../../catalog/stories/objects3d.js')
  const story = artillery.find(({ id }) => id === 'nemacki-top-kraljevo')
  const scene = new THREE.Scene()
  let model, drill
  const gun = await story.create({ scene, session: { clock: new GameClock() }, add(_, view, crewView) {
    model = view
    drill = crewView
  } })
  t.after(() => model.end())
  assert.deepEqual(gun.states, ['idle', 'attack', 'dead', 'wreck'])
  assert.equal(gun.state, 'idle')
  assert.ok(model.visual.visible && !model.damaged.visible)
  assert.ok(gun.mesh.parent === scene && !new THREE.Box3().setFromObject(gun.mesh).isEmpty())
  assert.equal(drill.crew.members.length, 2)
  const [gunner, loader] = drill.crew.members
  assert.ok(gunner.mesh.parent === loader.mesh.parent && loader.round.visible)
  const restingYaw = model.visual.rotation.y
  gun.update()
  model.update(0)
  assert.equal(model.visual.rotation.y, restingYaw)
  assert.equal(model.flash.mesh.visible, false)
  gun.setState('attack')
  gun.update()
  assert.equal(gun.shotsFired, 0, 'the preview waits for the loader')
  assert.equal(drill.crew.ready, false)
  for (let frame = 0; frame < 48; frame++) drill.update(1 / 60)
  assert.ok(drill.crew.ready && !loader.round.visible)
  gun.update()
  model.update(0)
  assert.equal(gun.shotsFired, 1)
  assert.equal(model.visual.rotation.y, restingYaw, 'attack keeps the opening heading')
  assert.ok(model.flash.mesh.visible && model.muzzle)
  assert.ok(model.elevation.position.z > model.restZ)
  drill.update(0)
  drill.update(.25)
  assert.equal(drill.crew.recoil, 0)
  gun.takeHit(10)
  model.update(.25)
  drill.update(0)
  assert.equal(drill.crew.recoil, 1)
  assert.ok(model.hit.mesh.visible && model.damaged.visible && !model.visual.visible)
  assert.equal(model.damaged.rotation.y, restingYaw)
  assert.equal(model.elevation.position.z, model.restZ)
  const dimensions = new THREE.Box3().setFromObject(model.visual, true)
  assert.ok(dimensions.equals(new THREE.Box3().setFromObject(model.damaged, true)))
  model.update(2)
  assert.ok(!model.hit.mesh.visible && model.damaged.visible, 'damage stays visible after the particles clear')
  assert.ok(model.damaged.getObjectByName('Barrel').material.map, 'the barrel has a painted impact map')
  gun.setState('idle')
  model.update(0)
  assert.ok(model.damaged.visible)
  gun.setState('dead')
  model.update(0)
  drill.update(0)
  assert.ok(drill.crew.members.every(member => !member.health.alive && member.fallMixer))
  assert.ok(model.wreck.visible && !model.visual.visible && !model.damaged.visible)
  assert.ok(model.embers.mesh.visible)
  assert.equal(model.smoke.mesh.geometry.attributes.position.count, 8)
  assert.ok(model.smoke.mesh.visible && model.smoke.mesh.material.opacity >= .35 && model.smoke.mesh.material.opacity < .4)
  model.update(1.2)
  assert.ok(model.smoke.mesh.material.opacity < .2)
  model.update(1.25)
  assert.equal(model.smoke.mesh.visible, false)
  assert.ok(model.embers.mesh.visible, 'the small fire distinguishes dead even after the smoke clears')
  gun.setState('wreck')
  model.update(0)
  drill.update(0)
  assert.equal(gun.state, 'wreck')
  assert.equal(loader.mesh.parent.visible, false)
  assert.ok(model.wreck.visible && !model.embers.mesh.visible && !model.smoke.mesh.visible && !model.hit.mesh.visible)
})
