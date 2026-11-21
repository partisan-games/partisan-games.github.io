import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

let Vis, fall, boss, paths, formationMembers, settings, levels, canvas2d

before(async() => {
  createPageElements()
  ;({ default: Vis } = await import('/scenes/vis/Main.js'))
  ;({ fall, boss } = await import('/scenes/vis/Waves.js'))
  ;({ paths } = await import('/scenes/vis/paths.js'))
  ;({ formationMembers } = await import('/scenes/vis/formations.js'))
  ;({ settings } = await import('/scenes/vis/settings.js'))
  ;({ levels } = await import('/scenes/vis/levels.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

/** Plays `scene` until its plane has landed on the base, letting the pictures load between frames. */
async function land(scene, play) {
  for (let i = 0; i < 60 * 20 && scene.player.lift > 0; i++) {
    play(1 / 60)
    await null
  }
  assert.equal(scene.player.lift, 0, 'it lands')
}

/** The running Vis scene flying `schedule` as its first stage, and a way to play it. */
function createScene(t, schedule) {
  const scene = new Vis()
  scene.init()
  scene.clear = () => {} // happy-dom has no 2D canvas
  scene.session.start()
  if (schedule) scene.waves.schedule = schedule
  t.after(() => scene.end())
  const play = (seconds, fps = 60) => {
    for (let i = 0; i < seconds * fps; i++) {
      scene.session.update(1 / fps)
      scene.update(1 / fps, i / fps)
    }
  }
  return { scene, waves: scene.waves, play }
}

/** Where a plane is on the screen. */
const onScreen = (scene, body) => scene.projection.point(body)

test('a wave comes at its time, and a shot down plane leaves the scene and the targets after its fall', t => {
  const { scene, waves, play } = createScene(t, [{ at: 2, path: 'straight', x: .5 }])
  play(1.9)
  assert.equal(waves.enemies.length, 0, 'not before its time')
  play(.2)
  assert.equal(waves.enemies.length, 1)
  const [{ body }] = waves.enemies
  assert.deepEqual(scene.targets, [body])
  body.setState('dead')
  play(fall.seconds - .1)
  assert.ok(scene.children.includes(body), 'still falling')
  play(.2)
  assert.equal(scene.children.includes(body), false)
  assert.deepEqual(scene.targets, [])
})

test('a plane that flies across the screen and out is gone', t => {
  const { waves, play } = createScene(t, [{ at: 0, path: 'straight', x: .5 }, { at: 1, path: 'fromBelow', x: .3 }])
  play(1.1)
  assert.equal(waves.enemies.length, 2)
  play(30)
  assert.equal(waves.enemies.length, 0)
})

for (const name of ['straight', 'wave', 'fromSide', 'fromBelow', 'uTurn'])
  test(`the ${name} path brings a plane onto the screen and flies the same at 30 and 60 frames per second`, t => {
    const positionAfter = (seconds, fps) => {
      const { scene, waves } = createScene(t, [])
      const [plane] = waves.formation({ path: name, x: .5, y: .1, side: 'left' })
      for (let i = 0; i < seconds * fps; i++) plane.flight.fly(1 / fps)
      return onScreen(scene, plane.body)
    }
    const at60 = positionAfter(2, 60), at30 = positionAfter(2, 30)
    assert.ok(Math.abs(at60.x - at30.x) < .01 && Math.abs(at60.y - at30.y) < .01, `${JSON.stringify(at60)} and ${JSON.stringify(at30)}`)
    assert.ok(at60.x >= 0 && at60.x <= canvas2d.width && at60.y >= 0 && at60.y <= canvas2d.height, `on the screen: ${JSON.stringify(at60)}`)
  })

test('a plane of a wave fires at the player only once it is on the screen', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, path: 'straight', x: .5 }])
  play(1 / 60)
  const [{ body }] = waves.enemies
  body.reload.start(0)
  play(1 / 60)
  assert.equal(body.shotsFired, 0, 'it starts above the screen')
  play(1)
  body.reload.start(0)
  play(1 / 60)
  assert.ok(body.shotsFired > 0)
  const round = body.bullets.projectiles.find(projectile => projectile.active)
  const { player } = scene
  const aim = Math.atan2(player.z - round.z, player.x - round.x)
  assert.ok(Math.abs(Math.atan2(round.vz, round.vx) - aim) < .1, 'at the player')
})

test('each path goes where its name says', () => {
  const route = { x: .5, y: .1, speed: 200, width: 1000, height: 800 }
  const at = (name, time, extra = {}) => paths[name].position(time, { ...route, ...extra })
  assert.ok(at('straight', 3).y > at('straight', 1).y, 'straight goes down')
  assert.ok(at('fromBelow', 3).y < at('fromBelow', 1).y, 'fromBelow goes up')
  assert.ok(at('fromSide', .5, { side: 'left' }).x < at('fromSide', 1.5, { side: 'left' }).x, 'from the left it flies right')
  assert.ok(at('fromSide', .5, { side: 'right' }).x > at('fromSide', 1.5, { side: 'right' }).x, 'from the right it flies left')
  assert.ok(at('uTurn', 10).y < at('uTurn', 4).y, 'uTurn comes back up')
})

test('a formation has its planes at the formation gap, across the path or one behind another', () => {
  const gap = 70, speed = 140
  const line = formationMembers({ formation: 'line', count: 5, gap, speed })
  assert.deepEqual(line.map(member => member.across), [-140, -70, 0, 70, 140])
  const column = formationMembers({ formation: 'column', count: 3, gap, speed })
  assert.deepEqual(column.map(member => member.delay), [0, .5, 1])
  const vee = formationMembers({ formation: 'vee', count: 5, gap, speed })
  assert.deepEqual(vee.map(member => member.delay), [1, .5, 0, .5, 1], 'the wings trail the leader')
})

test('a formation flies with its members at their places, and a shot down plane goes on straight ahead', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, formation: 'line', count: 3, path: 'straight', x: .5 }])
  play(2)
  const xs = waves.enemies.map(({ body }) => Math.round(onScreen(scene, body).x))
  const middle = Math.round(canvas2d.width / 2)
  assert.deepEqual(xs, [middle - settings.formationGap, middle, middle + settings.formationGap])
  const [shot, flying] = waves.enemies
  shot.body.setState('dead')
  const from = { x: shot.body.x, z: shot.body.z }
  play(1)
  assert.ok(Math.abs(shot.body.z - from.z - settings.enemies.fighter.speed / 10) < .1, 'on ahead at its speed')
  assert.equal(shot.body.x, from.x, 'without turning')
  const { flight } = flying
  assert.equal(flying.body.x, flight.position(flight.age).x, 'the others keep to their path')
})

test('a formation shot down to the last plane drops one power-up where that plane fell; one that got away drops none', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, formation: 'pair', path: 'straight', x: .5 }])
  const drops = []
  waves.onFormationDown = position => drops.push(position)
  play(1.5)
  const [first, last] = waves.enemies
  first.body.setState('dead')
  play(.5)
  assert.equal(drops.length, 0, 'not while a plane of it flies')
  last.body.setState('dead')
  play(1 / 60)
  assert.equal(drops.length, 1)
  const fell = onScreen(scene, last.body)
  assert.ok(Math.hypot(drops[0].x - fell.x, drops[0].y - fell.y) < 10)
  play(1)
  assert.equal(drops.length, 1, 'only once')

  const away = createScene(t, [{ at: 0, formation: 'pair', path: 'straight', x: .5 }])
  const none = []
  away.waves.onFormationDown = position => none.push(position)
  away.play(1.5)
  away.waves.enemies[0].body.setState('dead')
  away.play(20)
  assert.deepEqual(none, [])
})

test('each plane shot down scores its points once, and none after the result', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, formation: 'pair', path: 'straight', x: .5 }])
  play(1)
  waves.enemies[0].body.takeHit(1)
  play(.1)
  assert.equal(scene.score, settings.enemies.fighter.points)
  scene.defeat()
  waves.enemies[1].body.takeHit(1)
  play(.1)
  assert.equal(scene.score, settings.enemies.fighter.points)
})

test('a lost plane takes a life and its extra guns, and comes back at the start, safe for a while', t => {
  const { scene, play } = createScene(t, [])
  const { player } = scene
  player.fireLevel = 2
  player.takeHit(1)
  play(1 / 60)
  assert.equal(scene.lives, 2)
  assert.equal(player.fireLevel, 0)
  play(3)
  assert.equal(player.alive, true)
  assert.ok(player.shield > 0)
  assert.equal(player.takeHit(1), false, 'safe just after coming back')
  play(2.5)
  player.takeHit(1)
  player.takeHit(1)
  play(1 / 60)
  assert.equal(scene.lives, 1)
})

test('a bomb shoots down the planes around the player, takes out their rounds, and only so many bombs', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, formation: 'line', count: 3, path: 'straight', x: .5 }])
  play(1.5)
  const { player } = scene
  for (const { body } of waves.enemies) body.z = player.z - 5
  const [near] = waves.enemies
  near.body.reload.start(0)
  near.body.aimAt(player)
  near.body.shoot()
  player.dropBomb()
  play(1 / 60)
  assert.ok(waves.enemies.every(({ body }) => body.dead))
  assert.ok(near.body.bullets.projectiles.every(round => !round.active))
  player.bombs = 0
  assert.equal(player.dropBomb(), false)
})

test('the boss sways across the upper half with its nose down, and flies away if not shot down in time', t => {
  const { scene, waves, play } = createScene(t, [{ at: 0, enemy: 'boss' }])
  scene.player.shield = Infinity // the boss's fire must not end the game first
  const xs = []
  for (let i = 0; i < 15; i++) {
    play(1)
    xs.push(onScreen(scene, waves.boss.body).x)
  }
  const { y } = onScreen(scene, waves.boss.body)
  assert.ok(y > 0 && y < canvas2d.height / 2, 'in the upper half')
  assert.ok(Math.max(...xs) - Math.min(...xs) > canvas2d.width * .3, 'left and right')
  assert.equal(waves.boss.body.yaw, -Math.PI / 2, 'nose down')
  play(boss.timeLimit - 15)
  assert.ok(waves.boss, 'not before its time')
  play(10)
  assert.equal(waves.boss, undefined, 'up and away')
})

test('the boss is the end of the last stage: the victory comes only after it is down and the plane has landed', async t => {
  loadImages(t)
  const { scene, waves, play } = createScene(t, [{ at: 0, enemy: 'boss' }])
  scene.player.shield = Infinity
  scene.stage = 2
  play(10)
  assert.equal(scene.ui.outro, '', 'no victory while the boss flies')
  waves.boss.body.takeHit(settings.enemies.boss.hits)
  play(fall.seconds + 1)
  assert.equal(scene.ui.outro, '', 'not before the plane has landed')
  await land(scene, play)
  assert.match(scene.ui.outro, /reached the island of Vis/)
})

test('the first two stages end at an airfield, where the plane lands, is serviced as it rests, and the sirens send it on', async t => {
  loadImages(t)
  const { scene, play } = createScene(t, [])
  t.mock.method(scene.ui, 'showMessage')
  scene.player.bombs = 0
  const { lives } = scene
  scene.lives = 1
  await land(scene, play)
  assert.ok(scene.player.bombs > 0, 'its bombs are filled')
  assert.equal(scene.lives, lives, 'and the lives of the pilot, up to a full load')
  const { x, z } = scene.player
  play(settings.restTime - .2)
  assert.deepEqual([scene.player.x, scene.player.z, scene.stage], [x, z, 0], 'it stands on the runway while the player rests')
  play(.4)
  assert.equal(scene.ui.showMessage.mock.calls[0].arguments[0], 'Sirens! The enemy is attacking the base!')
  for (let i = 0; i < 60 * 5 && scene.player.lift < 1; i++) play(1 / 60)
  assert.equal(scene.player.lift, 1, 'it takes off on its own')
  assert.ok(scene.controllers.includes(scene.keys), 'and is in the player hands again')
  assert.ok(scene.player.shield > 0, 'safe for a while')
  assert.equal(scene.stage, 1, 'the second stage begins')
  assert.equal(scene.waves.schedule, levels[1])
  assert.equal(scene.ui.outro, '')
})

test('the plane flies above the clouds: the renderer draws it after them', t => {
  const { scene } = createScene(t, [])
  assert.ok(scene.oblaci.every(cloud => scene.playerView.position.z < cloud.position.z))
})

test('an airfield never takes away lives or bombs above a full load', t => {
  const { scene } = createScene(t, [])
  scene.lives = 5
  scene.player.bombs = 6
  scene.service()
  assert.deepEqual([scene.lives, scene.player.bombs], [5, 6])
})
