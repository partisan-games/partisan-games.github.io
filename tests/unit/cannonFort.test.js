import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'
import { buildFort, standing } from '/scenes/cannon/Fort.js'
import World from '/core/World.js'

register('./setup/ammo-node.js', import.meta.url)
let PhysicsWorld, FortPhysics, CannonScene, Ammo
before(async() => {
  createPageElements()
  PhysicsWorld = (await import('/core3d/physics/PhysicsWorld.js')).default
  FortPhysics = (await import('/scenes/cannon/FortPhysics.js')).default
  CannonScene = (await import('/scenes/cannon/Main.js')).default
  ;({ Ammo } = await import('/core3d/physics/index.js'))
})

function bunker(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const scene = new THREE.Scene()
  const physics = new PhysicsWorld({ scene })
  const ground = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40))
  ground.position.y = -.5
  physics.add(ground, 0)
  const { parts } = buildFort()
  const fortPhysics = new FortPhysics({ parts, physics })
  const game = Object.assign(Object.create(CannonScene.prototype), {
    scene, physics, fortPhysics, stones: parts, scenery: { hit() {}, sync() {} }, cannon: {},
    blasts: { add() {}, update() {} }, smoke: { update() {} }, scorches: { add() {} },
    defenders: { living: 1, update() {}, hit() {}, blast() {} },
    world: new World(), input: { pressed: {} }, barrel: { rotation: {} },
    crew: { update() {} }, infantry: { update: () => [] }, power: { value: 10, min: 10, max: 25 },
    player: { dead: false, alive: true, look() {} },
    surrender: { pending: false, update() {} }, flag: { update() {} },
    posts: [], tracers: { update() {} }, shells: [], impacts: [],
  })
  t.after(() => {
    physics.dispose()
    assert.equal(physics.nativeCount, 0)
    assert.ok(parts.every(part => !part.userData.body))
  })
  return game
}

function advance(physics, seconds, fps = 60) {
  for (let frame = 0; frame < seconds * fps; frame++) physics.update(1 / fps)
}

test('the barracks start fully roofed and remain exactly in place for two minutes in real Ammo', t => {
  const game = bunker(t)
  assert.ok(game.stones.length > 0 && game.stones.length <= 239)
  const leftWing = game.stones.filter(part => part.position.x < -1)
  const rightWing = game.stones.filter(part => part.position.x > 1)
  assert.ok(Math.max(...rightWing.map(part => part.position.y)) > Math.max(...leftWing.map(part => part.position.y)) + .6)
  const bounds = game.stones.map(part => new THREE.Box3().setFromObject(part))
  for (let column = 6; column < 18; column++) {
    const rows = column < 12 ? 6 : 8
    for (let row = 0; row < rows; row++) {
      const center = new THREE.Vector3((column - 8.5) * .55, (row + .5) * .31, -13.19)
      const slit = row === 4 && (column === 8 || column === 16)
      assert.equal(bounds.some(box => box.containsPoint(center)), !slit)
    }
  }
  for (let column = 6; column < 18; column++) {
    const x = (column - 8.5) * .55
    const roofHeight = column < 12 ? 6 * .31 : 8 * .31
    for (const z of [-13.2, -14.5, -15.7])
      assert.ok(bounds.some(box => box.containsPoint(new THREE.Vector3(x, roofHeight + .08, z))),
        `missing roof over column ${column} at z=${z}`)
  }
  const cap = leftWing.find(part => part.geometry.type === 'CylinderGeometry')
  assert.ok(cap, 'the detached round bunker has its own roof')
  for (const angle of [-Math.PI / 6, 0, Math.PI / 6, Math.PI]) {
    const ray = new THREE.Raycaster(new THREE.Vector3(cap.position.x, .31 * 3.5, cap.position.z),
      new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)), 0, cap.geometry.parameters.radiusBottom)
    const hitsWall = ray.intersectObjects(leftWing, false).length > 0
    assert.equal(hitsWall, angle === 0 || angle === Math.PI, 'two open embrasures face the player')
  }
  const started = performance.now()
  advance(game.physics, 120)
  t.diagnostic(`Intact fort: ${((performance.now() - started) / 7200).toFixed(3)} ms per update (native physics and mesh sync)`)
  assert.equal(standing(game.stones), game.stones.length)
  for (const part of game.stones) {
    assert.ok(part.position.equals(part.userData.home))
    assert.equal(part.userData.body.isStaticOrKinematicObject(), true)
  }
})

test('a distant explosion leaves the intact fort fixed', t => {
  const game = bunker(t)
  game.explode({ x: 0, y: .2, z: 0 })
  advance(game.physics, 5)
  assert.equal(game.fortPhysics.fixed.size, game.stones.length)
  assert.equal(standing(game.stones), game.stones.length)
})

test('the first impacts cannot move masonry, while repeated hits breach a local section', t => {
  const game = bunker(t)
  const { physics, stones, fortPhysics } = game
  const bodies = new Map(stones.map(part => [part, part.userData.body]))
  const hit = stones.find(part => part.position.y < .2 && Math.abs(part.position.x) < .3)
  const point = hit.position.clone().add(new THREE.Vector3(.2, 0, .1))
  for (let shot = 0; shot < 3; shot++) {
    game.explode(point)
    advance(physics, 1)
    assert.equal(fortPhysics.fixed.size, stones.length)
    assert.equal(standing(stones), stones.length)
  }
  for (let shot = 0; shot < 3; shot++) game.explode(point)
  assert.ok(fortPhysics.fixed.size > 0, 'distant masonry stays fixed')
  assert.ok(fortPhysics.fixed.size < stones.length, 'nearby masonry becomes dynamic')
  for (const part of stones) {
    if (bodies.has(part)) assert.equal(part.userData.body, bodies.get(part))
    assert.equal(part.userData.body.isStaticOrKinematicObject(), fortPhysics.fixed.has(part))
    if (!fortPhysics.fixed.has(part))
      for (const upper of fortPhysics.above.get(part) ?? [])
        if (fortPhysics.supports.get(upper).every(support => !fortPhysics.fixed.has(support)))
          assert.equal(fortPhysics.fixed.has(upper), false, 'masonry without any fixed support must be released')
  }
  assert.equal(new Set(physics.rigidBodies).size, physics.rigidBodies.length)
  advance(physics, 5)
  assert.ok(standing(stones) < stones.length, 'the actual blast moves pieces away from home')
  for (const part of fortPhysics.fixed) assert.ok(part.position.equals(part.userData.home))
  game.explode(hit.userData.home.clone())
  assert.equal(new Set(physics.rigidBodies).size, physics.rigidBodies.length)
})

test('focused repeated blasts can eventually release the whole fort without permanently fixed pieces', t => {
  const game = bunker(t)
  let shots = 0
  while (game.fortPhysics.fixed.size && shots < 200) {
    const remaining = [...game.fortPhysics.fixed]
    const target = remaining.reduce((best, part) => {
      const nearby = remaining.filter(other => other.position.distanceTo(part.position) < 1.3).length
      return nearby > best.nearby ? { part, nearby } : best
    }, { part: remaining[0], nearby: 0 }).part
    const point = target.position.clone().add(new THREE.Vector3(0, -.05, .2))
    for (let hit = 0; hit < 4; hit++) game.explode(point)
    shots += 4
  }
  advance(game.physics, 5)
  t.diagnostic(`Full release: ${shots} shots, ${standing(game.stones)} parts near their starting places`)
  assert.equal(game.fortPhysics.fixed.size, 0)
  assert.ok(standing(game.stones) < game.stones.length)
})

test('an actual shell contact queues the blast until native contact dispatch is complete', t => {
  const game = bunker(t)
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.12))
  ball.position.set(0, .8, -11)
  game.physics.add(ball, 1)
  const velocity = new Ammo.btVector3(0, 0, -12)
  ball.userData.body.setLinearVelocity(velocity)
  Ammo.destroy(velocity)
  const shell = { ball, mesh: new THREE.Object3D(), update() {} }
  game.shells.push(shell)
  let queued = false
  game.physics.contacts.once(ball.userData.body, point => {
    game.impacts.push({ ball, point })
    queued = true
    assert.equal(game.fortPhysics.fixed.size, game.stones.length, 'native contact iteration must not reinsert any bodies')
  })
  for (let frame = 0; frame < 120; frame++) {
    game.update(1 / 60, frame / 60)
    if (queued) break
  }
  assert.equal(queued, true)
  assert.equal(game.fortPhysics.fixed.size, game.stones.length, 'one shell must not breach intact masonry')
  assert.ok([...game.fortPhysics.damage.values()].some(damage => damage > 0))
  assert.equal(game.impacts.length, 0)
  assert.equal(game.shells.length, 0)
  assert.equal(game.physics.rigidBodies.includes(ball), false)
  assert.equal(game.physics.contacts.listeners.size, 0)
})
