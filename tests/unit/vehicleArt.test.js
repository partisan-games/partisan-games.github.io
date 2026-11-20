import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let TenkLevo, TenkDesno, GroundEnemy, groundEnemyArt, profiles, GameClock
const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ default: TenkLevo } = await import('/scenes/tenkici/TenkLevo.js'))
  ;({ default: TenkDesno } = await import('/scenes/tenkici/TenkDesno.js'))
  ;({ GroundEnemy, profiles } = await import('/scenes/to-trieste/GroundEnemies.js'))
  ;({ groundEnemyArt } = await import('/scenes/to-trieste/enemyArt.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
})

for (const [name, tankClass, width, height, x, forward] of [
  ['partisan', () => TenkLevo, 300, 129, 150, 1],
  ['German', () => TenkDesno, 327, 137, 800, -1],
]) test(`${name} tank keeps its collider and cannon when loading a full atlas and rolls both ways`, t => {
  const Tank = tankClass()
  const tank = new Tank({ clock: new GameClock(), scale: .4, x, y: 300, xLimit: Infinity })
  loadAtlas(tank, width * 4, height * 2)
  assert.deepEqual([tank.width, tank.height, tank.y], [width * .4, height * .4, 300])
  const barrelOffset = { x: tank.cev.x - tank.x, y: tank.cev.y - tank.y }
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  tank.dx = forward * 40
  tank.update(.16)
  tank.render()
  assert.deepEqual(draws.at(-1).slice(1, 5), [width, height, width, height])
  assert.deepEqual(draws.at(-1).slice(5), [-tank.width / 2, -tank.height / 2, tank.width, tank.height])
  const { elapsed } = tank.bodySprite
  tank.update(0)
  assert.equal(tank.bodySprite.name, 'drive', 'the first zero-time tick after resuming preserves the pose')
  assert.equal(tank.bodySprite.elapsed, elapsed, 'pause/resume preserves the held drive phase')
  tank.bodySprite.reset()
  tank.dx = -forward * 40
  tank.update(.16)
  tank.render()
  assert.deepEqual(draws.at(-1).slice(1, 5), [width * 3, height, width, height])
  assert.ok(Math.abs(tank.cev.x - tank.x - barrelOffset.x) < 1e-9)
  assert.ok(Math.abs(tank.cev.y - tank.y - barrelOffset.y) < 1e-9)
  tank.dx = 0
  tank.update(.1)
  tank.render()
  assert.equal(draws.at(-1)[2], 0, 'stopping uses the static idle row')
  tank.setState('dead')
  tank.update(1)
  assert.equal(tank.bodySprite.name, 'idle')
  assert.equal(tank.bodySprite.frameIndex, 0)
})

for (const kind of ['germanTank', 'truck', 'tank']) test(`${kind} animates its own drive, not road scrolling, and resets after destruction`, () => {
  const art = groundEnemyArt[kind]
  const enemy = new GroundEnemy({ ...profiles.find(profile => profile.kind === kind),
    art, clock: new GameClock(), target: { x: 0, y: 300, width: 20, height: 20, alive: true },
    x: 500, groundY: 300, scrollSpeed: -160, nextSpawnX: () => 2000 })
  loadAtlas(enemy, art.sprite.frame.width * 4, art.sprite.frame.height * 2)
  assert.deepEqual([enemy.width, enemy.height], [art.width, art.height])
  assert.equal(enemy.y + enemy.height / 2, 305)
  enemy.update(.16)
  assert.equal(enemy.bodySprite.name, 'idle', 'scrolling alone must not rotate the wheels')
  enemy.setState('drive')
  enemy.update(.16)
  assert.equal(enemy.bodySprite.name, 'drive')
  assert.equal(enemy.bodySprite.frameIndex, 1)
  const { elapsed } = enemy.bodySprite
  enemy.update(0)
  assert.equal(enemy.bodySprite.elapsed, elapsed, 'zero game time cannot advance the loop')
  if (enemy.fire) {
    enemy.setState('fire')
    enemy.update(.16)
    assert.equal(enemy.bodySprite.name, 'drive', 'a moving tank still rolls while firing')
  }
  enemy.die()
  enemy.update(.16)
  assert.equal(enemy.dx, -160)
  assert.equal(enemy.bodySprite.frameIndex, 0)
  assert.equal(enemy.bodySprite.name, 'idle')
  enemy.reset()
  assert.equal(enemy.bodySprite.frameIndex, 0)
  assert.equal(enemy.alive, true)
})

test('the Do Trsta truck and the Kluz truck select the same atlas and clip definitions', async() => {
  const { default: spriteArt } = await import('/core/actor/spriteArt.js')
  const { sprite, width, height } = groundEnemyArt.truck
  assert.equal(sprite.src, spriteArt['opel-blitz'].src)
  assert.equal(sprite.clips, spriteArt['opel-blitz'].clips)
  assert.deepEqual([width, height], [137, 60])
})
