import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { register } from 'node:module'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import GameLoop from '/core/GameLoop.js'
import World from '/core/World.js'

register('./setup/ammo-node.js', import.meta.url)
let CannonScene, UI
before(async() => {
  createPageElements()
  CannonScene = (await import('/scenes/cannon/Main.js')).default
  UI = (await import('/ui/UI.js')).default
})

async function level(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const data = await readFile(new URL(`../..${url}`, import.meta.url))
    return new FBXLoader().parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const data = await readFile(new URL(`../..${url}`, import.meta.url))
    return new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
  })
  const game = Object.assign(Object.create(CannonScene.prototype), {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(75, 16 / 9, .1, 1000),
    session: new GameSession(), gameLoop: new GameLoop(() => {}), world: new World(), syncSounds() {},
  })
  game.ui = new UI(game, { showControls: false })
  await game.init()
  game.cannon.sounds.forEach(sound => t.mock.method(sound, 'play', () => {}))
  game.posts.forEach(post => {
    post.gunner.random = () => 0
  })
  game.session.start()
  t.after(() => {
    game.gameLoop.stop()
    game.world.end(game.player)
    game.session.dispose()
    game.ui.end()
  })
  return game
}

function play(game, seconds) {
  for (let frame = 0; frame < seconds * 60; frame++) {
    game.session.update(1 / 60)
    game.update(1 / 60, frame / 60)
  }
}

test('Cannon initializes its actual model and puts the camera close to the barrel regardless of a saved orbital view', async t => {
  const saved = localStorage.getItem('cameraIndex')
  localStorage.setItem('cameraIndex', '2')
  t.after(() => saved === null ? localStorage.removeItem('cameraIndex') : localStorage.setItem('cameraIndex', saved))
  const game = await level(t)
  const introPosition = game.camera.position.clone()
  const introDirection = game.camera.getWorldDirection(new THREE.Vector3())
  play(game, 1)
  assert.ok(game.camera.position.distanceTo(introPosition) < 1e-5)
  assert.ok(game.camera.getWorldDirection(new THREE.Vector3()).distanceTo(introDirection) < 1e-5)
  const breech = game.barrel.getWorldPosition(new THREE.Vector3())
  const cameraDistance = game.camera.position.distanceTo(breech)
  assert.ok(cameraDistance > 2 && cameraDistance < 3)
  assert.ok(game.camera.fov >= 60 && game.camera.fov < 70)
  assert.equal(localStorage.getItem('cameraIndex'), '2', 'other games retain the saved camera choice')
  const initial = game.camera.getWorldDirection(new THREE.Vector3())
  assert.ok(initial.z < -.98 && Math.abs(initial.x) < .01)
  const initialMuzzle = game.muzzle.getWorldPosition(new THREE.Vector3())
  game.input.keyboard.up = true
  play(game, .6)
  game.input.keyboard.up = false
  play(game, .3)
  assert.ok(game.camera.getWorldDirection(new THREE.Vector3()).y > initial.y)
  assert.ok(game.muzzle.getWorldPosition(new THREE.Vector3()).y > initialMuzzle.y)
  assert.ok(game.muzzle.getWorldDirection(new THREE.Vector3()).y > .3, 'the barrel can rise above the terrace roofline')

  // Read the front ring from the visible tube independently of the Muzzle marker.
  const tube = game.barrel.getObjectByName('Barrel')
  const coords = tube.geometry.attributes.position
  tube.geometry.computeBoundingBox()
  const front = tube.geometry.boundingBox.min.z
  const opening = tube.localToWorld(new THREE.Vector3(0, 0, front))
  const bore = opening.clone().sub(tube.getWorldPosition(new THREE.Vector3())).normalize()
  let innerRadius = Infinity
  for (let i = 0; i < coords.count; i++)
    if (Math.abs(coords.getZ(i) - front) < 1e-5)
      innerRadius = Math.min(innerRadius, Math.hypot(coords.getX(i), coords.getY(i)))
  game.shoot()
  const shell = game.shells[0]
  assert.ok(shell.mesh.position.distanceTo(opening) < 1e-5)
  assert.ok(shell.way.dot(bore) > .99999)
  assert.ok(Math.abs(shell.mesh.scale.x * .078 - innerRadius) < 1e-5)
  const round = game.crew.loader.round
  game.crew.update(.65, 0)
  assert.ok(round.visible)
  const loadingTip = round.localToWorld(new THREE.Vector3(0, .193, 0))
  assert.ok(loadingTip.distanceTo(game.barrel.localToWorld(new THREE.Vector3(0, 0, .47))) < 1e-5)
  game.input.keyboard.pressed.ArrowDown = true
  play(game, .7)
  assert.equal(round.visible, false, 'the loaded round has disappeared inside the gun')
  assert.ok(game.muzzle.getWorldPosition(new THREE.Vector3()).y < initialMuzzle.y)
})

test('three hits leave the real fort motionless while all surviving machine guns keep firing', async t => {
  const game = await level(t)
  const crewHealth = () => game.crew.members.reduce((total, member) => total + member.health.current, 0)
  const health = crewHealth()
  const foundation = Math.min(...game.stones.map(stone => stone.position.y))
  const part = game.stones.find(stone => stone.position.y === foundation && Math.abs(stone.position.x) < .3)
  const point = part.position.clone().add(new THREE.Vector3(0, 0, .2))
  for (let shot = 0; shot < 3; shot++) {
    game.explode(point)
    play(game, 2)
    assert.equal(game.standing, game.stones.length)
    assert.equal(game.fortPhysics.fixed.size, game.stones.length)
  }
  assert.ok(crewHealth() < health, 'the garrison keeps hitting the crew during the opening shots')
  assert.equal(game.garrison.surrendered, false)
  game.explode(point)
  play(game, 1)
  assert.ok(game.fortPhysics.fixed.size < game.stones.length)
  assert.ok(game.fortPhysics.fixed.size > game.stones.length / 2, 'one breach must leave most of the fort firm')
})

test('the surviving crew member can fire and losing the last one ends the battle', async t => {
  const game = await level(t)
  t.mock.method(game.ui.defeatSound, 'play', () => {})
  game.posts.length = 1
  t.mock.method(game.posts[0].gunner, 'update', () => ({ hit: true }))
  const [first, second, rifleman] = game.crew.members
  t.mock.method(game.crew, 'pickTarget', () => game.crew.members.find(member => member.health.alive))
  const fullHealth = game.crewMeter.max
  game.update(1 / 60, 0)
  const damage = fullHealth - game.crewMeter.value
  assert.ok(damage > 0 && first.health.alive)
  assert.equal(game.crewMeter.value, first.health.current + second.health.current + rifleman.health.current)
  for (let left = first.health.current; left > 0; left -= damage) game.fireBack(0)
  const fallen = game.crew.members.find(member => !member.health.alive)
  assert.equal(fallen.mesh.parent, game.scene)
  assert.equal(game.crewMeter.value, second.health.current + rifleman.health.current)
  assert.equal(game.session.state, 'running')
  game.shoot()
  assert.equal(game.shells.length, 1)
  for (let left = second.health.current; left > 0; left -= damage) game.fireBack(0)
  assert.equal(game.session.state, 'running')
  for (let left = rifleman.health.current; left > damage; left -= damage) game.fireBack(0)
  game.update(1 / 60, 1 / 60)
  assert.equal(game.crewMeter.value, 0)
  assert.equal(game.session.state, 'finished')
  assert.match(game.ui.outro, /gun crew has been killed/)
  const shells = game.shells.length
  game.shoot()
  assert.equal(game.shells.length, shells)
})

test('only enemy bursts draw tracers and a fallen flank fighter costs the crew no health', async t => {
  const game = await level(t)
  const { shooter } = game.crew
  const fighter = game.infantry.fighters[0]
  fighter.gun.wait = 0
  shooter.rifleman.wait = 0
  const bursts = t.mock.method(game.tracers, 'burst')
  game.update(.08, 0)
  assert.equal(shooter.rifleman.shots, 1)
  assert.equal(fighter.gun.shots, 1)
  assert.equal(bursts.mock.callCount(), 0)
  assert.equal(game.shells.length, 0)
  const health = game.player.health.current
  const post = game.posts[0]
  t.mock.method(post.gunner, 'update', () => ({ hit: false }))
  t.mock.method(game.infantry, 'pickTarget', () => fighter)
  game.fireBack(0)
  assert.equal(bursts.mock.callCount(), 1)
  assert.equal(bursts.mock.calls[0].arguments[0], post.position)
  assert.equal(fighter.alive, false)
  assert.equal(game.player.health.current, health)
  assert.equal(game.crewMeter.value, health)
  fighter.gun.wait = 0
  fighter.update(1)
  assert.equal(fighter.gun.shots, 1)
})

test('the canyon frames the barracks on a raised terrace on the gun bank', async t => {
  const game = await level(t)
  play(game, .1)
  game.scene.updateMatrixWorld(true)
  assert.ok(game.scene.fog)
  const origin = new THREE.Vector3(0, 3, -13)
  for (const side of [-1, 1]) {
    const ray = new THREE.Raycaster(origin, new THREE.Vector3(side, 0, 0), 1, 40)
    assert.ok(ray.intersectObjects(game.scene.children, true).length > 0, 'the inward cliff face must be visible from the valley')
  }
  const terrain = game.physics.rigidBodies.filter(mesh => mesh.userData.body.isStaticOrKinematicObject() && !game.stones.includes(mesh))
  const height = z => new THREE.Raycaster(new THREE.Vector3(0, 4, z), new THREE.Vector3(0, -1, 0))
    .intersectObjects(terrain, false)[0].point.y
  assert.equal(height(0), 0)
  assert.ok(height(-7) > height(0) && height(-7) < height(-13))
  assert.ok(Math.abs(height(-13) - height(-16.5)) < .001)
  assert.ok(height(-22) < height(-16.5))
  const barrel = game.barrels[0]
  const groundAtBarrel = new THREE.Raycaster(new THREE.Vector3(barrel.position.x, 4, barrel.position.z), new THREE.Vector3(0, -1, 0))
    .intersectObjects(terrain, false)[0].point.y
  assert.ok(Math.abs(new THREE.Box3().setFromObject(barrel).min.y - groundAtBarrel) < .015)
  assert.ok(game.scenery.props.every(({ mesh }) => !mesh.userData.body.isStaticOrKinematicObject()))
  const start = barrel.position.clone()
  game.explode(start.clone().add(new THREE.Vector3(.35, .2, 0)))
  play(game, .3)
  assert.ok(barrel.position.distanceTo(start) > .05, 'a blast moves the visible barrel')
  const log = game.scenery.instances.find(({ batch }) => batch.geometry.type === 'CylinderGeometry')
  const before = log.mesh.position.clone()
  game.explode(before.clone().add(new THREE.Vector3(0, .1, -.25)))
  play(game, .2)
  const drawn = new THREE.Matrix4()
  log.batch.getMatrixAt(log.index, drawn)
  assert.ok(log.mesh.position.distanceTo(before) > .05)
  assert.ok(new THREE.Vector3().setFromMatrixPosition(drawn).distanceTo(log.mesh.position) < 1e-5)
  const stones = game.scene.children.flatMap(child => [child, ...child.children]).find(mesh => mesh.isInstancedMesh)
  let disposals = 0
  stones.addEventListener('dispose', () => {
    disposals++
  })
  game.session.dispose()
  assert.equal(disposals, 1, 'the session must release the instance buffer as well as its geometry and material')
  game.session.dispose()
  assert.equal(disposals, 1)
})
