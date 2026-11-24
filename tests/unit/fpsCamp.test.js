import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import campLayout from '/scenes/fps-base/campLayout.js'
import CampEnvironment, { models } from '/scenes/fps-base/CampEnvironment.js'
import { requestModels } from '/core3d/assets/models.js'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import World from '/core/World.js'

const randomFor = seed => {
  let value = seed
  return () => {
    value = Math.imul(value, 1664525) + 1013904223 | 0
    return (value >>> 0) / 4294967296
  }
}
const arrayBuffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

function modelFiles(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    texture.image = { width: 64, height: 64 }
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1254, height: 1254 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url =>
    new GLTFLoader().parseAsync(arrayBuffer(await readFile(url.slice(1))), url.slice(0, url.lastIndexOf('/') + 1)))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url =>
    new FBXLoader().parse(arrayBuffer(await readFile(url.slice(1))), ''))
  t.mock.method(OBJLoader.prototype, 'loadAsync', async url => new OBJLoader().parse(await readFile(url.slice(1), 'utf8')))
  t.mock.method(MTLLoader.prototype, 'loadAsync', async url => new MTLLoader().parse(await readFile(url.slice(1), 'utf8'), ''))
}

test('32 camp layouts retain connected branches and dead ends around the storehouse, with one joined yard and the original exit', () => {
  for (let seed = 1; seed <= 32; seed++) {
    const { maze, rooms, spawnPoints, walls } = campLayout(randomFor(seed))
    const visited = new Set([maze.first_cell]), pending = [maze.first_cell]
    while (pending.length) for (const next of Object.values(pending.pop().links)) if (!visited.has(next)) {
      visited.add(next)
      pending.push(next)
    }
    assert.equal(rooms.length, 56)
    assert.equal(visited.size, 56)
    assert.ok(visited.has(maze.last_cell))
    assert.ok(rooms.filter(cell => cell.links_length === 1).length >= 3)
    for (const cell of rooms) assert.ok(visited.has(cell))
    for (let row = 2; row <= 3; row++) for (let column = 2; column <= 5; column++)
      assert.equal(maze.cell(row, column).links_length, 0)
    for (const [a, b] of [[[4, 3], [4, 4]], [[4, 3], [5, 3]], [[5, 3], [5, 4]], [[4, 4], [5, 4]]])
      assert.ok(maze.cell(...a).linked(maze.cell(...b)))
    assert.deepEqual(maze.exitPosition, { x: 35, y: 0, z: 40 })
    assert.deepEqual(maze.tilePosition(1, 1), { x: -35, y: 0, z: -35 })
    assert.equal(spawnPoints.length, 54)
    for (const point of spawnPoints) {
      assert.ok(Math.hypot(point.x + 35, point.z + 35) > 5)
      assert.ok(!(point.x > -20 && point.x < 20 && point.z > -20 && point.z < 0))
    }
    assert.ok(walls.some(wall => wall.kind === 'timber'))
    assert.ok(walls.some(wall => wall.kind === 'wire'))
  }
})

test('real camp assembly blocks exactly the closed maze edges and lets the open exit and cell links through', async t => {
  modelFiles(t)
  await requestModels(models)
  const layout = campLayout(randomFor(9))
  const camp = new CampEnvironment(layout)
  const queries = camp.queries()
  for (const cell of layout.rooms) {
    const from = { ...layout.maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1), y: .89 }
    for (const [name, direction] of [['north', { x: 0, y: 0, z: -1 }], ['south', { x: 0, y: 0, z: 1 }],
      ['west', { x: -1, y: 0, z: 0 }], ['east', { x: 1, y: 0, z: 0 }]]) {
      const open = cell.linked(cell[name]) || cell === layout.maze.last_cell && name === 'south'
      assert.equal(queries.isBlocked(from, direction, 9), !open, `${cell.id} ${name}`)
    }
  }
  for (const kind of ['wire', 'timber']) {
    const wall = layout.walls.find(wall => wall.kind === kind)
    const x = (wall.a[0] + wall.b[0]) / 2, z = (wall.a[1] + wall.b[1]) / 2
    const dx = wall.b[0] - wall.a[0], dz = wall.b[1] - wall.a[1], length = Math.hypot(dx, dz)
    const from = { x: x + dz / length, y: .89, z: z - dx / length }
    const to = { x: x - dz / length, y: .89, z: z + dx / length }
    const direction = { x: to.x - from.x, y: 0, z: to.z - from.z }
    assert.equal(queries.isBlocked(from, direction, 2), true)
    assert.equal(queries.isBlocked({ ...from, y: 2.7 }, direction, 2), true, 'jumping still collides with the legs')
    assert.equal(queries.sees(from, to), kind === 'wire')
    assert.equal(queries.obstacleAt(from, direction, 2) < 2, kind === 'timber')
    if (kind === 'timber') {
      const impact = queries.impactAt(from, direction, 2)
      assert.ok(impact && !impact.object.isInstancedMesh, 'decal geometry receives the actual cover matrix')
    }
  }
  assert.equal(queries.groundAt(0, 0, 10), 0)
  assert.equal(camp.props[0].gateFraction, 1)
  assert.equal(camp.props.filter(prop => prop.lights.length).length, 2)
  assert.ok(camp.props.flatMap(prop => prop.lights).every(light => !light.castShadow))
  assert.equal(camp.mesh.children.filter(child => child.name === 'CampFence').length, 3, 'all wire and posts use three instanced draws')
  assert.ok(camp.mesh.children.filter(child => child.name === 'CampFence')
    .every(child => child.material.userData.outlineParameters.visible === false))
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
  crate.position.set(-35, .5, -35)
  crate.updateMatrixWorld(true)
  const from = { x: -36, y: .6, z: -35 }, to = { x: -34, y: .6, z: -35 }
  assert.equal(queries.sees(from, to), true)
  camp.walkSolids.push(crate)
  camp.opaqueSolids.push(crate)
  assert.equal(queries.sees(from, to), false, 'later props become cover for both player and AI')
  assert.equal(queries.isBlocked(from, { x: 1, y: 0, z: 0 }, 2), true)
  const released = []
  camp.mesh.traverse(part => {
    if (part.isInstancedMesh) part.addEventListener('dispose', () => released.push(part))
  })
  camp.end()
  camp.end()
  assert.equal(released.length, 4)
  assert.equal(new Set(released).size, 4, 'each owned instance buffer is released once')
})

test('FPS camp initializes with real model files, ten enemies and two first aids, and wins near the old exit with every guard alive', async t => {
  createPageElements()
  modelFiles(t)
  const { default: FpsBaseScene } = await import('/scenes/fps-base/Main.js')
  const { default: FPSRenderer } = await import('/core3d/actor/FPSRenderer.js')
  t.mock.method(FPSRenderer.prototype, 'render', () => {})
  const games = []
  const fresh = () => {
    const game = Object.assign(Object.create(FpsBaseScene.prototype), {
      scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), world: new World(),
      session: new GameSession(), canvas: document.getElementById('platno'), syncSounds() {},
    })
    games.push(game)
    return game
  }
  const game = fresh()
  t.after(() => games.forEach(game => {
    game.world.end(game.player)
    game.disposeScene()
    game.session.dispose()
  }))
  await game.init()
  assert.ok(game.scene.getObjectByName('CrveniKrstCamp'))
  assert.equal(game.enemies.length, 10)
  assert.equal(game.firstAids.length, 2)
  assert.equal(game.camp.walkSolids.length, 11)
  assert.ok(game.enemies.every(enemy => Math.hypot(enemy.x - game.player.x, enemy.z - game.player.z) > 12))
  const wins = []
  game.victory = text => wins.push(text)
  game.defeat = () => assert.fail('the player is alive')
  const { x, z } = game.maze.exitPosition
  game.player.x = x
  game.player.z = z - 5.01
  game.update(0, 0)
  assert.equal(wins.length, 0)
  game.player.z = z - 4.99
  game.update(0, 0)
  assert.equal(wins.length, 1)
  assert.ok(game.enemies.every(enemy => enemy.alive))
  const repeat = fresh()
  await repeat.init()
  assert.notEqual(repeat.camp, game.camp)
  assert.equal(repeat.enemies.length, 10)
  assert.equal(repeat.firstAids.length, 2)
  assert.equal(repeat.camp.props[0].gateFraction, 1)
  assert.deepEqual([repeat.player.x, repeat.player.z], [-35, -35])
  assert.equal(repeat.camp.props.flatMap(prop => prop.lights).length, 2)

  const weapons = repeat.children.find(child => child.guards)
  const [guard] = weapons.guards
  const { avatar } = weapons
  const pipe = avatar.current.grip
  const held = avatar.hand.getWorldPosition(new THREE.Vector3())
  assert.equal(repeat.player.reach, 1.65)
  repeat.player.attack()
  const { length } = repeat.player.swing
  repeat.player.swingOn(length / 2)
  avatar.update(length / 2)
  assert.equal(avatar.action.getClip().name, 'One Hand Sword Combo')
  assert.ok(avatar.hand.getWorldPosition(new THREE.Vector3()).distanceTo(held) > .05)
  repeat.player.swingOn(length / 2)
  avatar.update(length / 2)
  assert.ok(avatar.hand.getWorldPosition(new THREE.Vector3()).distanceTo(held) < .001)
  guard.body.takeHit(guard.body.health.current)
  assert.equal(weapons.pickUp(), false, 'a distant guard cannot be looted')
  guard.body.x = repeat.player.x + 1
  guard.body.z = repeat.player.z
  assert.equal(weapons.pickUp(), true)
  assert.equal(weapons.avatar.current.grip.name, guard.model.file)
  assert.ok(repeat.player.reach > 1.65)
  assert.equal(pipe.visible, false)
  assert.equal(guard.carried.visible, false)
  assert.equal(weapons.pickUp(), false, 'the same weapon transfers only once')

  const surface = repeat.camp.mesh.children.find(mesh => mesh.name === 'CampFence').material
  let disposed = false
  surface.addEventListener('dispose', () => {
    disposed = true
  })
  repeat.disposeScene()
  assert.equal(disposed, true, 'scene disposal owns the new fence materials')
})
