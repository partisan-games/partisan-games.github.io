import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Box3, Raycaster, Texture, TextureLoader, Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import Body from '/core/gameplay/bodies/Body.js'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import { firearms } from '/core/gameplay/Firearm.js'
import { createStoneWall } from '/core3d/geometry/stoneWall.js'
import { requestModels } from '/core3d/assets/models.js'
import { models as coverSoldierModels } from '/core3d/actor/soldiers/CoverSoldierModel.js'
import * as rifleman from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import * as partisan from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import * as gunner from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { YardAttacker, YardDefender, YardWalk } from '/scenes/drvar/yardCover.js'
import { createPageElements } from './helpers/dom.js'

test('crouching keeps feet on the ground, slows movement, and uses a real stone wall as cover', () => {
  const player = new Character({ x: -.55, strikeHeight: .82 })
  let held = false, reloading = false, nearWall = true
  const walk = new YardWalk(player, { keyboard: { isDown: () => held }, run: true, up: true },
    { reloading: () => reloading, nearWall: () => nearWall })
  const wall = createStoneWall({ length: 6, height: 1.1, thickness: .6 })
  wall.rotation.y = Math.PI / 2
  wall.updateMatrixWorld(true)
  const attacker = new CoverSoldier({ x: 5, y: .9 })
  const origin = new Vector3(attacker.x, 1.5, 0)
  const seen = () => {
    const direction = new Vector3().copy(player.eye).sub(origin)
    const ray = new Raycaster(origin, direction.clone().normalize(), 0, direction.length())
    return ray.intersectObject(wall).length === 0
  }
  assert.equal(seen(), true)
  held = true
  walk.update(.25)
  assert.equal(player.crouched, true)
  assert.ok(Math.abs(player.feet) < 1e-6)
  assert.ok(player.steered.x < 1.5)
  assert.equal(seen(), false)

  // The wall interrupts a burst already aimed at the player.
  const shooter = new YardAttacker(attacker, { targets: [player], clearShot: seen, sees: seen })
  attacker.fireAt(player)
  attacker.setState('attack')
  const health = player.health.current
  shooter.update(.1)
  attacker.update(.1)
  assert.equal(attacker.state, 'idle')
  assert.equal(player.health.current, health)

  held = false
  reloading = true
  walk.update(.25)
  assert.equal(walk.waitingToStand, true)
  assert.equal(seen(), false)
  reloading = false
  walk.update(.03)
  assert.equal(walk.waitingToStand, true)
  walk.update(.25)
  assert.equal(walk.waitingToStand, false)
  assert.equal(seen(), true)
  nearWall = false
  reloading = true
  walk.update(.25)
  assert.equal(player.crouched, false)
})

test('a comrade pops up for the last shot, then reloads below the wall before standing again', () => {
  const enemy = new Body({ x: 20, y: 1.4, size: { length: 1, height: 1.6, width: 1 }, health: 1000 })
  const body = new Character({ strikeHeight: .82, targets: [enemy], reach: 60, actions: { attack: .1 } })
  const gun = { ...firearms.rifle, magazine: 1 }
  const defender = new YardDefender(body, { enemies: [enemy], gun, sees: () => true, random: () => .5 })
  const step = () => {
    defender.update(.025)
    body.update(.025)
  }
  assert.equal(body.crouched, true)
  for (let i = 0; i < 80; i++) step()
  assert.equal(body.shotsFired, 1)
  assert.ok(defender.reload > 0 && body.size.height < 1.05)
  for (let i = 0; i < 45; i++) step()
  assert.equal(body.shotsFired, 1)
  assert.equal(body.crouched, true)
  for (let i = 0; i < 100; i++) step()
  assert.equal(body.shotsFired, 2)
})

test('all four comrades keep their boots grounded and their crouching poses inside the churchyard', async t => {
  createPageElements()
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(decodeURI(url.slice(1)))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { default: DrvarScene } = await import('/scenes/drvar/Main.js')
  await requestModels([...coverSoldierModels, ...rifleman.models, ...partisan.models, ...gunner.models])
  const posts = [[gunner, { x: 1, z: -.4, yaw: 0 }], [rifleman, { x: 0, z: -1, yaw: Math.PI / 2 }],
    [partisan, { x: 0, z: 1, yaw: -Math.PI / 2 }], [rifleman, { x: -1, z: .4, yaw: Math.PI }]]
  for (const [{ description: figure }, post] of posts) {
    const scene = Object.assign(Object.create(DrvarScene.prototype), {
      targets: [], enemies: [], world: { controllers: [] }, add(body, view) {
        this.view = view
      },
    })
    const body = scene.placeComrade(post, { figure })
    const { view } = scene
    assert.equal(view.clip, 'crouch')
    const skin = new Box3()
    view.mesh.traverse(part => {
      if (part.isSkinnedMesh) skin.expandByObject(part, true)
    })
    assert.ok(Math.abs(skin.min.y) < .02 && skin.max.y < 1.1, `${figure.model.file}: ${skin.min.y} to ${skin.max.y}`)
    const checkWall = () => {
      view.mesh.updateMatrixWorld(true)
      const point = new Vector3()
      view.mesh.traverse(part => {
        if (!part.isMesh) return
        const { count } = part.geometry.getAttribute('position')
        for (let vertex = 0; vertex < count; vertex++) {
          part.getVertexPosition(vertex, point).applyMatrix4(part.matrixWorld)
          if (point.y < 0 || point.y > 1.12) continue
          assert.ok(Math.abs(point.x) < 11.7 && Math.abs(point.z) < 9.7,
            `${figure.model.file} clips a wall at ${point.x}, ${point.z}`)
        }
      })
    }
    for (let frame = 0; frame < 5; frame++) {
      view.update(.16, 0)
      checkWall()
    }
    body.crouched = false
    body.size.height = view.standingHeight
    body.y = view.standingHeight / 2
    view.update(.3, 0)
    checkWall()
    body.attack()
    for (let frame = 0; frame < 5; frame++) {
      view.update(.16, 0)
      checkWall()
    }
  }
})
