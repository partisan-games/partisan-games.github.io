import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import fitClip from '/core3d/actor/characters/fitClip.js'

test('a shared clip follows the receiving rig names and hip height without changing the donor', () => {
  const rig = (prefix, height) => {
    const group = new THREE.Group(), hip = new THREE.Bone()
    hip.name = prefix + 'Hips'
    hip.position.y = height
    group.add(hip)
    return group
  }
  const donor = rig('mixamorig', 10), receiver = rig('mixamorigIron_Giant', 20)
  const hip = new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, 1], [0, 10, 0, 0, 4, 0])
  const absent = new THREE.QuaternionKeyframeTrack('mixamorigEye.quaternion', [0], [0, 0, 0, 1])
  donor.animations = [new THREE.AnimationClip('fall', 1, [hip, absent])]
  const fitted = fitClip(donor, receiver, 'fall')
  assert.deepEqual(fitted.tracks.map(track => track.name), ['mixamorigIron_GiantHips.position'])
  assert.deepEqual([...fitted.tracks[0].values], [0, 20, 0, 0, 8, 0])
  assert.deepEqual([...hip.values], [0, 10, 0, 0, 4, 0])
})

/** A model 1.8 m tall with a clip for standing, walking, one attack and dying. */
function figure() {
  const mesh = new THREE.Group()
  mesh.add(new THREE.Mesh(new THREE.BoxGeometry(.5, 1.8, .4).translate(0, .9, 0)))
  mesh.userData.animations = [['Idle', 2], ['Walk', 1], ['Swing', .8], ['Dying', 1.5]]
    .map(([name, seconds]) => new THREE.AnimationClip(name, seconds, []))
  return { mesh, animDict: { idle: 'Idle', walk: 'Walk', attack: 'Swing', death: 'Dying' } }
}

test('a character model stands on its body\'s feet, faces its way and plays the clip of what it does', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel, clipLengths, modelSize } = await import('/core3d/actor/characters/CharacterModel.js')
  const { mesh, animDict } = figure()
  const actions = clipLengths(mesh.userData.animations, animDict)
  assert.deepEqual(actions, { attack: .8 })
  const size = modelSize(mesh)
  assert.ok(Math.abs(size.height - 1.8) < 1e-6 && Math.abs(size.length - .4) < 1e-6, JSON.stringify(size))

  const body = new Character({ x: 3, z: -2, yaw: Math.PI / 2, size, actions })
  const model = new CharacterModel(body, { mesh, animDict })
  assert.equal(model.clip, 'idle')
  model.update(0)
  assert.deepEqual(model.mesh.position.toArray(), [3, 0, -2])
  const ahead = model.mesh.getWorldDirection(new THREE.Vector3()).negate()
  assert.ok(ahead.distanceTo(new THREE.Vector3(0, 0, -1)) < 1e-9, 'yaw a quarter left faces -z')

  body.steer({ ahead: 1 })
  body.update(1 / 30)
  model.update(1 / 30)
  assert.equal(model.clip, 'walk')
  body.attack()
  model.update(1 / 30)
  assert.equal(model.clip, 'attack')
  body.takeHit(1000)
  model.update(1 / 30)
  assert.equal(model.clip, 'death')
})

test('with no run clip of its own, a character runs its walk faster, and plays it back to front going back', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const mesh = new THREE.Group()
  mesh.add(new THREE.Mesh(new THREE.BoxGeometry(.5, 1.8, .4)))
  mesh.userData.animations = [new THREE.AnimationClip('Idle', 2, []), new THREE.AnimationClip('Walk', 1, [])]
  const body = new Character()
  const model = new CharacterModel(body, { mesh, animDict: { idle: 'Idle', walk: 'Walk' } })
  body.steer({ ahead: 1, running: true })
  model.update(1 / 30)
  assert.equal(model.clip, 'run')
  assert.equal(model.actions.run.getEffectiveTimeScale(), 1.5)
  body.steer({ ahead: -1, running: true })
  model.update(1 / 30)
  assert.equal(model.actions.run.getEffectiveTimeScale(), -1.5)
})

test('a backward jump starts at its last pose and plays in reverse; a later forward jump resets it', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const { mesh, animDict } = figure()
  mesh.userData.animations.push(new THREE.AnimationClip('Jump', 1, []))
  animDict.jump = 'Jump'
  const body = new Character({ actions: { jump: 1 } })
  const model = new CharacterModel(body, { mesh, animDict })
  body.steer({ ahead: -1 })
  body.jump()
  model.update(0)
  const action = model.actions.jump
  assert.equal(model.clip, 'jump')
  assert.equal(action.getEffectiveTimeScale(), -1)
  assert.equal(action.time, 1)
  model.update(.2)
  assert.ok(Math.abs(action.time - .8) < 1e-9)
  assert.equal(action.paused, false)
  body.update(1.1)
  model.update(0)
  body.steer({ ahead: 1 })
  body.jump()
  model.update(0)
  assert.equal(model.clip, 'jump')
  assert.equal(action.time, 0)
  assert.equal(action.getEffectiveTimeScale(), 1)
  model.update(.2)
  assert.ok(Math.abs(action.time - .2) < 1e-9)
})

test('a flying character under a floating box lands on the ground below, not on top of the box', async() => {
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40))
  floor.position.set(0, -.5, 0)
  const box = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5))
  box.position.set(0, 5.5, 0)
  const { groundAt } = worldQueries([floor, box])
  const body = new Character({ x: 6, jumping: 'fly', groundAt })
  body.jump(.28)
  body.x = 0
  for (let i = 0; i < 60; i++) {
    body.update(1 / 30)
    assert.ok(body.feet < 3, `its feet stay under the box, at ${body.feet}`)
  }
  assert.ok(Math.abs(body.feet) < 1e-9, 'it lands on the floor')
})

test('the camera hurries after a falling character, even one with no clips', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterChase } = await import('/core3d/actor/characters/CharacterChase.js')
  const climb = body => {
    const mesh = new THREE.Object3D(), camera = new THREE.PerspectiveCamera()
    const chase = new CharacterChase(body, { mesh, clip: null }, { camera, showHealthBar: false })
    // the first frame puts the camera in its place
    chase.update(0)
    const start = camera.position.y
    mesh.position.y = 10
    chase.update(1 / 30)
    chase.end()
    return camera.position.y - start
  }
  const standing = climb(new Character())
  const falling = new Character({ jumping: 'fly', y: 20 })
  falling.y = 20
  falling.vy = -5
  assert.ok(climb(falling) > standing * 3, 'it follows a fall four times as fast')
})

test('a ranged wall hit leaves a decal, while a target hit or a miss does not', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const wall = new THREE.Mesh(new THREE.BoxGeometry(.5, 3, 3))
  wall.position.set(3, 1.5, 0)
  const solids = [wall]
  const { impactAt, ...queries } = worldQueries(solids)
  const body = new Character({ reach: 10, ...queries })
  const model = new CharacterModel(body, { ...figure(), impactAt })
  const scene = new THREE.Scene()
  scene.add(wall, model.mesh)
  t.after(() => model.end())
  const decals = () => scene.children.filter(mesh => mesh.isMesh && mesh !== wall)
  assert.equal('impactAt' in body, false, 'the body has no query returning 3D intersections')
  body.attack()
  body.update(.5)
  await model.strike()
  assert.equal(decals().length, 1)
  assert.ok(decals()[0].geometry.attributes.position.count > 0, 'a real mark is projected on the wall')
  decals()[0].geometry.computeBoundingBox()
  assert.ok(Math.abs(decals()[0].geometry.boundingBox.min.x - 2.75) < 1e-6, 'the mark lies on the hit face')
  const target = new Character({ x: 1 })
  body.targets = [target]
  body.attack()
  body.update(.5)
  await model.strike()
  assert.equal(target.hitsTaken, 1)
  assert.equal(decals().length, 1, 'a nearer target shields the wall from the decal')
  const lastImpact = model.ricochet.mesh.position.clone()
  solids.pop()
  body.targets = []
  body.attack()
  body.update(.5)
  await model.strike()
  assert.equal(decals().length, 1)
  assert.ok(model.ricochet.mesh.position.equals(lastImpact), 'a miss adds no impact in empty air')
})

test('a shot awaiting its effects cannot add particles or decals after its view ends', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const wall = new THREE.Mesh(new THREE.BoxGeometry(.5, 3, 3))
  wall.position.set(3, 1.5, 0)
  const { impactAt, ...queries } = worldQueries([wall])
  const body = new Character({ reach: 10, ...queries })
  const model = new CharacterModel(body, { ...figure(), impactAt })
  const scene = new THREE.Scene()
  scene.add(wall, model.mesh)
  body.attack()
  body.update(.5)
  const pending = model.strike()
  model.end()
  await pending
  assert.equal(scene.children.length, 2)
  assert.ok(scene.children.includes(wall) && scene.children.includes(model.mesh))
})

test('ending a view disposes owned particle resources, even those not yet added to the scene, only once', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const { default: Particles, Flame } = await import('/core3d/Particles.js')
  const model = new CharacterModel(new Character(), figure())
  model.ricochet = new Particles({ num: 1 })
  model.flame = new Flame({ num: 1 })
  const scene = new THREE.Scene()
  scene.add(model.mesh, model.ricochet.mesh)
  const disposed = { geometry: 0, material: 0, texture: 0 }
  for (const effect of [model.ricochet, model.flame]) {
    effect.mesh.geometry.addEventListener('dispose', () => disposed.geometry++)
    effect.mesh.material.addEventListener('dispose', () => disposed.material++)
    effect.mesh.material.map.addEventListener('dispose', () => disposed.texture++)
  }
  model.end()
  model.end()
  assert.deepEqual(disposed, { geometry: 2, material: 2, texture: 2 })
  assert.equal(model.ricochet.mesh.parent, null)
  assert.equal(scene.children.length, 1)
})

test('a flame finishing its import after teardown creates no effect resources', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel } = await import('/core3d/actor/characters/CharacterModel.js')
  const model = new CharacterModel(new Character(), { ...figure(), flame: {} })
  model.end()
  await import('/core3d/Particles.js')
  assert.equal(model.flame, undefined)
})

test('a led character\'s camera button comes after its touch buttons, so the page lifts it above them', async t => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { lead } = await import('/core3d/actor/characters/leadCharacter.js')
  const scene = { camera: new THREE.PerspectiveCamera(), controllers: [], add: (...parts) => scene.parts.push(...parts), parts: [] }
  const { keys, chase } = lead(scene, { body: new Character(), model: { mesh: new THREE.Object3D(), clip: 'idle' } },
    { input: { useJoystick: true, buttonDict: { attack: '' } }, view: { showCameraButton: true } })
  t.after(() => {
    keys.end(); chase.end()
  })
  const buttons = document.querySelector('.button-container'), camera = chase.view.chaseCamera.button
  assert.ok(buttons && camera)
  assert.ok(buttons.compareDocumentPosition(camera) & Node.DOCUMENT_POSITION_FOLLOWING)
})

test('a dead model with no death clip falls on its side, unless it is intact, as a gun whose crew has fallen', async() => {
  createPageElements()
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { default: CharacterModel, modelSize } = await import('/core3d/actor/characters/CharacterModel.js')
  const tilt = deathPose => {
    const mesh = new THREE.Group()
    mesh.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1)))
    const body = new Character({ size: modelSize(mesh) })
    const model = new CharacterModel(body, { mesh, deathPose })
    body.takeHit(1000)
    for (let frame = 0; frame < 60; frame++) {
      body.update(1 / 30)
      model.update(1 / 30)
    }
    return model.mesh.rotation.z
  }
  assert.ok(tilt(null) > 1)
  assert.equal(tilt('intact'), 0)
})
