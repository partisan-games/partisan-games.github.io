import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Matrix4, Texture, TextureLoader, Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import GameSession from '/core/runtime/GameSession.js'
import { requestModels } from '/core3d/assets/models.js'
import { description, models } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import ReliefColumn, { columnDepth, columnSize } from '/scenes/drvar/ReliefColumn.js'
import { createPageElements } from './helpers/dom.js'

test('Drvar advances with game time and wins when the Ličani reach the churchyard', async() => {
  createPageElements()
  const { default: DrvarScene } = await import('/scenes/drvar/Main.js')
  const waves = [], outcomes = []
  const lead = { x: -31, steer() {} }
  const session = new GameSession()
  const scene = Object.assign(Object.create(DrvarScene.prototype), {
    session, wave: 0, enemies: [{ alive: true }], targets: [], planes: [], player: { dead: false },
    gameLoop: { start() {} },
    ui: { clearIntro() {} },
    world: { update() {} },
    comrades: [{ dead: false }],
    syncSounds() {},
    focusCanvas() {},
    lockPointer() {},
    sendWave() {
      waves.push(this.wave)
    },
    takeMachineGun() {},
    sendRelief() {
      this.relief = [lead]
    },
    victory(text, title) {
      outcomes.push(title)
      session.finish()
    },
  })
  const step = dt => {
    session.update(dt)
    scene.update(dt, 0)
  }

  scene.start()
  step(51)
  session.pause()
  step(100)
  assert.deepEqual(waves, [0])
  session.resume()
  step(1)
  assert.deepEqual(waves, [0, 1])

  step(59)
  assert.equal(scene.relief, undefined)
  step(1)
  assert.equal(scene.relief[0], lead)
  assert.deepEqual(outcomes, [])
  lead.x = -18
  step(1)
  step(1)
  assert.deepEqual(outcomes, ['Stigli su Ličani!'])
  assert.equal(scene.enemies[0].alive, true)
})

test('the moving reserve draws the real riflemen as shared geometry within the west road', async t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(decodeURI(url.slice(1)))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const column = new ReliefColumn(description, variants.smedji.outfit, new Map())
  t.after(() => column.end())
  assert.equal(column.mesh.visible, false)

  const { children: batches } = column.mesh
  assert.ok(batches.length >= 6 && batches.length < columnSize)
  assert.ok(batches.every(batch => batch.isInstancedMesh && !batch.castShadow))
  for (const { count, material, geometry } of batches) {
    assert.equal(count * 3, columnSize)
    if (Array.isArray(material)) {
      assert.ok(geometry.groups.length > 0)
      assert.equal(new Set(geometry.groups.map(group => group.materialIndex)).size, geometry.groups.length)
    }
  }
  const ranks = new Set()
  const transform = new Matrix4(), position = new Vector3()
  for (const batch of batches)
    for (let i = 0; i < batch.count; i++) {
      batch.getMatrixAt(i, transform)
      position.setFromMatrixPosition(transform)
      assert.ok(Math.abs(position.z) < 3 && -position.x <= columnDepth)
      ranks.add(position.toArray().join(','))
    }
  assert.equal(ranks.size, columnSize)

  const initialPose = batches[0].geometry.getAttribute('position').array
  const lead = { x: -31, state: 'move' }
  column.follow(lead)
  lead.x = -18
  column.update(column.duration / 4)
  assert.equal(column.mesh.visible, true)
  assert.equal(column.mesh.position.x, -18)
  assert.ok(initialPose.some((value, i) => Math.abs(value - batches[0].geometry.getAttribute('position').array[i]) > .01))
})
