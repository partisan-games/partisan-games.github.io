import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let createGroundEnemies, GameClock, TenkLevo, canvas2d

before(async() => {
  createPageElements()
  createGroundEnemies = (await import('/scenes/to-trieste/GroundEnemies.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

function encounter(callback = () => {}) {
  const clock = new GameClock()
  const target = new TenkLevo({ clock, src: null, cevSlika: null, width: 50, height: 50, x: 100, y: 300 })
  const enemies = createGroundEnemies({ clock, target, obstacles: [], groundY: 300, scrollSpeed: -160, callback })
  for (const enemy of enemies) {
    enemy.width = 100
    enemy.height = 40
    enemy.onload()
  }
  return { clock, target, enemies }
}

test('ground vehicles approach faster than the scenery while the gun stays fixed in the world', () => {
  const { enemies } = encounter()
  for (const enemy of enemies) {
    assert.equal(enemy.y + enemy.height / 2, 305)
    assert.equal(enemy.position.z, -1)
    const start = enemy.x
    enemy.update(.1)
    assert.ok(enemy.x < start)
    if (enemy.kind === 'antiTankGun') assert.equal(enemy.dx, -160)
    else assert.ok(enemy.dx < -160)
  }
})

test('spawns stay staggered and a returned enemy starts a new life behind the other arrivals', () => {
  const { enemies } = encounter()
  assert.ok(enemies[0].x > canvas2d.width)
  for (let i = 1; i < enemies.length; i++) assert.ok(enemies[i].x - enemies[i - 1].x >= 360)
  const first = enemies[0]
  const life = first.lifeId
  const lastRight = Math.max(...enemies.slice(1).map(enemy => enemy.x + enemy.width / 2))
  first.x = -first.width
  first.checkBounds()
  assert.ok(first.x > lastRight)
  assert.notEqual(first.lifeId, life)
  assert.equal(first.alive, true)
})

test('destruction scores once, stops the drive, and respawning restores the vehicle drive', () => {
  let points = 0
  const { enemies } = encounter(() => points++)
  const enemy = enemies[0]
  enemy.die()
  enemy.die()
  assert.equal(points, 1)
  assert.equal(enemy.dx, -160)
  enemy.x = -enemy.width
  enemy.checkBounds()
  assert.equal(enemy.alive, true)
  assert.ok(enemy.dx < -160)
  enemy.die()
  assert.equal(points, 2)
})

test('armed vehicles and guns fire after the approach delay while transport remains unarmed', () => {
  const { clock, enemies } = encounter()
  for (const enemy of enemies) enemy.x = 400
  clock.advance(1.5)
  for (const enemy of enemies) enemy.update(0)
  for (const enemy of enemies) {
    if (enemy.kind === 'truck') assert.equal(enemy.fire, undefined)
    else assert.equal(enemy.fire.projectiles.projectiles.length, 1)
  }
})

test('a passed or destroyed enemy stops opening fire without removing its flying projectiles', () => {
  const { clock, enemies } = encounter()
  const enemy = enemies[0]
  enemy.x = 400
  clock.advance(1.5)
  enemy.update(0)
  const [shot] = enemy.fire.projectiles.projectiles
  enemy.x = 50
  clock.advance(10)
  enemy.update(0)
  assert.equal(enemy.fire.projectiles.projectiles.length, 1)
  assert.equal(shot.visible, true)
  enemy.die()
  clock.advance(10)
  enemy.update(0)
  assert.equal(enemy.fire.projectiles.projectiles.length, 1)
  assert.equal(shot.visible, true)
})

for (const kind of ['germanTank', 'tank', 'antiTankGun']) test(`${kind} launches along its separate barrel from its actual tip`, () => {
  const { clock, target, enemies } = encounter()
  const tank = enemies.find(enemy => enemy.kind === kind)
  tank.x = 400
  clock.advance(1.5)
  tank.update(0)
  const [shot] = tank.fire.projectiles.projectiles
  assert.ok(tank.children.includes(tank.barrel))
  assert.equal(shot.x, tank.barrel.muzzle.x)
  assert.equal(shot.y, tank.barrel.muzzle.y)
  const speed = Math.hypot(shot.dx, shot.dy)
  assert.ok(Math.abs(shot.dx / speed - Math.cos(tank.barrel.angle)) < 1e-10)
  assert.ok(Math.abs(shot.dy / speed - Math.sin(tank.barrel.angle)) < 1e-10)
  const time = (target.x - shot.x) / shot.dx
  assert.ok(time > 0)
  assert.ok(Math.abs(shot.y + shot.dy * time + shot.gravity * time * time / 2 - target.y) < .01)
})

for (const kind of ['germanTank', 'tank', 'antiTankGun']) test(`${kind} barrel follows range and wreck layers and resets on return`, () => {
  const { enemies, target } = encounter()
  const tank = enemies.find(enemy => enemy.kind === kind)
  tank.x = 400
  target.y = tank.y + tank.height * tank.barrel.anchor.y
  tank.update(0)
  const nearAngle = tank.barrel.angle
  tank.x = 700
  tank.update(0)
  assert.ok(tank.barrel.angle > nearAngle)
  const lastAngle = tank.barrel.angle
  tank.die()
  tank.position.z = -2
  const previousX = tank.barrel.x
  tank.update(.1)
  assert.ok(tank.barrel.x < previousX)
  assert.equal(tank.barrel.angle, lastAngle)
  assert.equal(tank.barrel.position.z, tank.position.z)
  tank.x = -tank.width
  tank.checkBounds()
  assert.equal(tank.barrel.angle, Math.PI)
  assert.equal(tank.barrel.x, tank.x + tank.width * tank.barrel.anchor.x)
})
