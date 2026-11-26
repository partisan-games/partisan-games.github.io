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
import { formationFor, waves } from '/scenes/drvar/assault.js'
import { createPageElements } from './helpers/dom.js'

test('Drvar advances with game time and wins when the Ličani reach the churchyard', async() => {
  createPageElements()
  const { default: DrvarScene } = await import('/scenes/drvar/Main.js')
  const sent = [], outcomes = [], weapons = []
  const lead = { x: -31, steer() {} }
  const gunner = { dead: false, setState() {
    this.dead = true
  } }
  const session = new GameSession()
  const scene = Object.assign(Object.create(DrvarScene.prototype), {
    session, wave: 0, enemies: [{ alive: true }], targets: [], planes: [], player: { dead: false },
    gameLoop: { start() {} },
    ui: { clearIntro() {}, showMessage() {} },
    world: { update() {} },
    comrades: [gunner],
    trigger: { firearm: { automatic: false }, equip(firearm) {
      weapons.push(firearm)
      this.firearm = firearm
    } },
    syncSounds() {},
    focusCanvas() {},
    lockPointer() {},
    sendWave() {
      sent.push(this.wave)
    },
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
  assert.deepEqual(sent, [0])
  session.resume()
  step(1)
  assert.deepEqual(sent, [0, 1])
  assert.equal(gunner.dead, false)
  assert.equal(weapons.length, 0)
  gunner.dead = true
  step(0)
  step(0)
  assert.equal(weapons.length, 1)
  assert.equal(weapons[0].automatic, true)

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

test('the first drop spreads across town and the later formations concentrate west in shorter groups', () => {
  const [first, second] = waves
  assert.ok(first.zone > second.zone)
  assert.ok(second.fireLimit > first.fireLimit)
  assert.deepEqual(second.passes.map(({ at }) => at), [0, 4, 16, 21])
  for (const pass of first.passes) assert.ok(formationFor(first, pass).every(plane => plane.x > 0))
  for (const pass of second.passes) assert.ok(formationFor(second, pass).every(plane => plane.x < 0))
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
