import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let GroundTarget, Rifleman, Flak, Fighter, GameObject2D, GameSession, kinds
const canvasContext = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {}, imageSmoothingEnabled: true }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => canvasContext)
  ;({ default: GroundTarget } = await import('/scenes/franjo-kluz/GroundTarget.js'))
  ;({ default: Rifleman } = await import('/scenes/franjo-kluz/Rifleman.js'))
  ;({ default: Flak } = await import('/scenes/franjo-kluz/Flak.js'))
  ;({ default: Fighter } = await import('/scenes/franjo-kluz/Fighter.js'))
  ;({ default: GameObject2D } = await import('/core/actor/GameObject2D.js'))
  ;({ default: GameSession } = await import('/core/runtime/GameSession.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
})

const camera = { cameraX: 0, cameraY: 0 }
const place = { camera, groundY: 500, x: 200 }

function loadAtlas(object, width, height) {
  Object.defineProperties(object.image, {
    naturalWidth: { value: width, configurable: true },
    naturalHeight: { value: height, configurable: true },
  })
  object.image.onload()
}

function armed(t) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const plane = new GameObject2D(null, { x: 300, y: 200, width: 80, height: 40 })
  return { session, plane }
}

test('enemy atlas loading keeps each former collider and the ground position', () => {
  for (const kind of Object.values(kinds)) {
    const target = new GroundTarget({ ...kind, ...place })
    const expected = kind.size.map(value => value * .75)
    loadAtlas(target, kind.art.frame.width * 4, kind.art.frame.height * Object.keys(kind.art.clips).length)
    assert.deepEqual([target.width, target.height], expected)
    assert.equal(target.y + target.height / 2, place.groundY)
    assert.equal(target.animation.width, kind.art.frame.width, 'the frame is one cell, not the entire atlas')
    target.update(.3)
    assert.equal(target.x, place.x, 'animation does not move the target')
    assert.deepEqual([target.width, target.height], expected)
  }
})

test('a rifle shot plays the shot for the aimed height, then holds aim, and cannot fire after death', t => {
  const soldier = new Rifleman({ ...kinds.soldier, ...place, ...armed(t) })
  loadAtlas(soldier, 512, 768)
  soldier.aimAt({ x: soldier.x + 100, y: soldier.y - 400 })
  soldier.setState('fire')
  soldier.cooldown.start(0)
  soldier.update(1 / 30)
  assert.equal(soldier.pose, 'fireUp')
  assert.equal(soldier.bullets.projectiles.length, 1)
  soldier.update(1)
  assert.equal(soldier.pose, 'fireUp', 'he holds the rifle at aim')
  assert.equal(soldier.animationElapsed, soldier.animationTime, 'a long frame still completes the one-shot')
  soldier.takeHit(20)
  soldier.cooldown.start(0)
  soldier.update(10)
  assert.equal(soldier.dead, true)
  assert.equal(soldier.visible, true)
  assert.equal(soldier.pose, 'death')
  assert.equal(soldier.animationElapsed, soldier.animationTime, 'the last falling frame remains selected')
  assert.equal(soldier.bullets.projectiles.length, 1)
})

test('a death before the image loads is not reset to idle by onload', t => {
  const soldier = new Rifleman({ ...kinds.assault, ...place, ...armed(t) })
  soldier.die()
  loadAtlas(soldier, 512, 768)
  assert.equal(soldier.pose, 'death')
  assert.equal(soldier.animation.name, 'death')
  assert.equal(soldier.animation.loop, false)
})

test('drawing selects the action cell, keeps the ground anchor and mirrors the soldier', t => {
  const soldier = new GroundTarget({ ...kinds.soldier, ...place })
  loadAtlas(soldier, 512, 768)
  const draws = [], scales = []
  t.mock.method(canvasContext, 'drawImage', (...args) => draws.push(args))
  t.mock.method(canvasContext, 'scale', (...args) => scales.push(args))
  soldier.play('fire')
  soldier.animationElapsed = soldier.animationTime * .6
  soldier.render()
  assert.deepEqual(draws[0].slice(1, 5), [256, 128, 128, 128])
  assert.deepEqual(scales, [[-1, 1]])
  const destination = draws[0].slice(5)
  assert.ok(Math.abs(destination[1] + soldier.art.anchor.y * destination[3] / 128 - soldier.height / 2) < 1e-9)
  soldier.die()
  soldier.update(10)
  soldier.render()
  assert.deepEqual(draws[1].slice(1, 5), [384, 256, 128, 128], 'the completed fall draws its last cell')
})

test('a destroyed vehicle stops its engine animation and keeps its fire', () => {
  const truck = new GroundTarget({ ...kinds.truck, ...place })
  loadAtlas(truck, 1280, 320)
  truck.update(.2)
  truck.die()
  let flameUpdates = 0
  truck.flame = { update: () => flameUpdates++ }
  const elapsed = truck.animationElapsed
  truck.update(1)
  assert.equal(truck.animationElapsed, elapsed)
  assert.equal(truck.visible, true)
  assert.equal(truck.burning, true)
  assert.equal(flameUpdates, 1)
})

test('the PVO flash belongs to an actual shot, follows its muzzle and expires', t => {
  const options = armed(t)
  const gun = new Flak({ ...place, ...options })
  gun.y = 400
  options.plane.setPosition(100, 100)
  gun.cooldown.start(0)
  gun.fire()
  assert.equal(gun.muzzleFlash.visible, false, 'no flash before the barrel is on target')
  gun.trainBarrel(10)
  gun.fire()
  assert.equal(gun.muzzleFlash.visible, true)
  assert.equal(gun.muzzleFlash.x, gun.muzzle.x)
  assert.equal(gun.muzzleFlash.y, gun.muzzle.y)
  gun.elevation -= .1
  gun.placeBarrel()
  assert.equal(gun.muzzleFlash.x, gun.muzzle.x)
  assert.equal(gun.muzzleFlash.y, gun.muzzle.y)
  assert.ok(Math.abs(Math.sin(gun.muzzleFlash.angle - gun.elevation)) < 1e-10)
  gun.muzzleFlash.update(1)
  assert.equal(gun.muzzleFlash.visible, false)
})

test('gun barrels and propellers stay visible in a distant world viewport', t => {
  const view = { cameraX: 5000, cameraY: 1000 }
  const options = armed(t)
  const gun = new Flak({ ...place, ...options, camera: view, x: 5300, groundY: 1500 })
  loadAtlas(gun, 204, 122)
  gun.barrel.width = 80
  gun.barrel.height = 60
  assert.equal(gun.barrel.x, gun.breech.x, 'placed as soon as the parent image loads')
  assert.equal(gun.barrel.y, gun.breech.y)
  assert.equal(gun.barrel.shown, true)
  const fighter = new Fighter({ ...options, camera: view, groundY: 1500 })
  fighter.enter({ x: 5300, y: 1200, fromBehind: false })
  fighter.propeller.width = 20
  fighter.propeller.height = 70
  fighter.propeller.setPosition(5200, 1200)
  assert.equal(fighter.propeller.shown, true)
  view.cameraX = 8000
  assert.equal(gun.barrel.shown, false)
  assert.equal(fighter.propeller.shown, false)
})
