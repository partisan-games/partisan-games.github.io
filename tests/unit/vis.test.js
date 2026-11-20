import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Enemy, enemy, boss, Waves, paths, formationMembers, settings, canvas2d

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }

    pause() {}
  }
  ;({ default: Enemy, enemy } = await import('/scenes/vis/Enemy.js'))
  ;({ boss } = await import('/scenes/vis/Boss.js'))
  Waves = (await import('/scenes/vis/Waves.js')).default
  ;({ paths } = await import('/scenes/vis/paths.js'))
  ;({ formationMembers } = await import('/scenes/vis/formations.js'))
  ;({ settings } = await import('/scenes/vis/settings.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

/** A game session that runs, as in a started game. */
const startedSession = () => {
  const session = new GameSession()
  session.start()
  return session
}

/** A stand-in for the scene and the player: only what Waves and the enemy planes use. */
function createWorld(schedule) {
  const scene = { session: startedSession(), children: [], add(...planes) {
    this.children.push(...planes)
  }, remove(...planes) {
    this.children = this.children.filter(plane => !planes.includes(plane))
  } }
  const player = { x: canvas2d.width / 2, y: canvas2d.height - 50, alive: true, targets: [] }
  const waves = new Waves({ scene, player, schedule })
  /** Plays the level as the scene does: the game clock, the planes, then the waves. */
  const play = (seconds, fps = 60) => {
    for (let i = 0; i < seconds * fps; i++) {
      scene.session.update(1 / fps)
      scene.children.forEach(plane => plane.update(1 / fps, waves.time))
      waves.update(1 / fps)
    }
  }
  return { scene, player, waves, play }
}

/* V1-02 · waves */

test('a wave comes at its time, and a shot down plane leaves the scene and the player\'s targets after its fall', () => {
  const { scene, player, waves, play } = createWorld([{ at: 2, path: 'straight', x: .5 }])

  play(1.9)
  assert.equal(scene.children.length, 0, 'not before its time')
  play(.2)
  assert.equal(scene.children.length, 1)
  assert.deepEqual(player.targets, scene.children)

  const [plane] = waves.enemies
  plane.die()
  play(enemy.fallTime - .1)
  assert.equal(scene.children.length, 1, 'still falling')
  play(.2)
  assert.equal(scene.children.length, 0)
  assert.deepEqual(player.targets, [])
  assert.equal(waves.finished, true, 'the level is over after the last wave')
})

test('a plane that flies across the screen and out is gone, and the level ends after the last wave', () => {
  const { waves, play } = createWorld([{ at: 0, path: 'straight', x: .5 }, { at: 1, path: 'fromBelow', x: .3 }])

  play(1.1)
  assert.equal(waves.enemies.length, 2)
  assert.equal(waves.finished, false)
  play(30)
  assert.equal(waves.enemies.length, 0)
  assert.equal(waves.finished, true)
})

/* V2-01 · paths and formations */

for (const name of ['straight', 'wave', 'fromSide', 'fromBelow', 'uTurn'])
  test(`the ${name} path brings a plane onto the screen and flies the same at 30 and 60 frames per second`, () => {
    const positionAfter = (seconds, fps) => {
      const { scene, waves } = createWorld([])
      const [plane] = waves.formation({ path: name, x: .5, y: .1, side: 'left' }, scene.session)
      for (let i = 0; i < seconds * fps; i++) plane.controller.flight.fly(1 / fps)
      return { x: plane.x, y: plane.y }
    }
    const at60 = positionAfter(2, 60), at30 = positionAfter(2, 30)

    assert.ok(Math.abs(at60.x - at30.x) < .01 && Math.abs(at60.y - at30.y) < .01, `${JSON.stringify(at60)} and ${JSON.stringify(at30)}`)
    assert.ok(at60.x >= 0 && at60.x <= canvas2d.width && at60.y >= 0 && at60.y <= canvas2d.height, `on the screen after 2 s: ${JSON.stringify(at60)}`)
  })

test('a plane of a wave fires at the player only once it is on the screen', () => {
  const { player, waves, play } = createWorld([{ at: 0, path: 'straight', x: .5 }])
  play(1 / 60)
  const [plane] = waves.enemies
  plane.weapon.cooldown.start(0)
  play(1 / 60)
  assert.equal(plane.state, 'idle', 'it starts above the screen')
  assert.equal(plane.bullets.projectiles.length, 0)

  play(1)
  plane.weapon.cooldown.start(0)
  play(1 / 60)
  const [bullet] = plane.bullets.projectiles
  const aim = Math.atan2(player.y - bullet.y, player.x - bullet.x)
  assert.ok(Math.abs(Math.atan2(bullet.dy, bullet.dx) - aim) < .05, 'at the player')

  player.alive = false
  play(1 / 60)
  assert.equal(plane.state, 'idle', 'not at a dead player')
})

test('the engine of a plane behind the leader of a formation is heard only once its flight has begun', () => {
  const { waves, play } = createWorld([{ at: 0, formation: 'column', count: 2, path: 'straight', x: .5 }])
  play(1 / 60)
  const [leader, follower] = waves.enemies
  const delay = settings.formationGap / settings.enemies.fighter.speed
  assert.equal(leader.engineRunning, true)
  assert.equal(follower.engineRunning, false)
  play(delay)
  assert.equal(follower.engineRunning, true)
})

test('each path goes where its name says', () => {
  const route = { x: .5, y: .1, speed: 200, width: 1000, height: 800 }
  const at = (name, t, extra = {}) => paths[name].position(t, { ...route, ...extra })

  assert.ok(at('straight', 3).y > at('straight', 1).y, 'straight goes down')
  assert.ok(at('fromBelow', 3).y < at('fromBelow', 1).y, 'fromBelow goes up')
  assert.ok(at('fromSide', .5, { side: 'left' }).x < at('fromSide', 1.5, { side: 'left' }).x, 'from the left it flies right')
  assert.ok(at('fromSide', .5, { side: 'right' }).x > at('fromSide', 1.5, { side: 'right' }).x, 'from the right it flies left')
  assert.ok(at('fromSide', 6, { side: 'left' }).y > at('fromSide', 3, { side: 'left' }).y, 'and then down')
  assert.ok(at('uTurn', 10).y < at('uTurn', 4).y, 'uTurn comes back up')
  const xs = [0, .5, 1, 1.5].map(t => at('wave', t).x)
  assert.ok(Math.max(...xs) - Math.min(...xs) > 100, 'wave weaves')
})

test('a formation has its planes at the formation gap, across the path or one behind another', () => {
  const gap = 70, speed = 140
  const line = formationMembers({ formation: 'line', count: 5, gap, speed })
  assert.deepEqual(line.map(member => member.across), [-140, -70, 0, 70, 140])
  assert.ok(line.every(member => member.delay === 0))

  const column = formationMembers({ formation: 'column', count: 3, gap, speed })
  assert.deepEqual(column.map(member => member.delay), [0, .5, 1])
  assert.ok(column.every(member => member.across === 0))

  const vee = formationMembers({ formation: 'vee', count: 5, gap, speed })
  assert.deepEqual(vee.map(member => member.delay), [1, .5, 0, .5, 1], 'the wings trail the leader')
  assert.equal(formationMembers({ formation: 'pair', gap, speed }).length, 2)
})

test('a formation launched by a wave flies with its members at their places', () => {
  const { waves, play } = createWorld([{ at: 0, formation: 'line', count: 3, path: 'straight', x: .5 }])
  play(2)
  const xs = waves.enemies.map(plane => Math.round(plane.x))
  const middle = Math.round(canvas2d.width / 2)
  assert.deepEqual(xs, [middle - settings.formationGap, middle, middle + settings.formationGap])
})

test('a shot down plane leaves its formation and goes on straight ahead, while the others fly on', () => {
  const { waves, play } = createWorld([{ at: 0, formation: 'line', count: 2, path: 'wave', x: .5 }])
  play(1)
  const [shot, flying] = waves.enemies
  shot.die()
  const fall = { x: shot.x, y: shot.y, angle: shot.angle }
  const { speed } = settings.enemies.fighter

  play(1)

  const heading = fall.angle - Math.PI / 2
  assert.ok(Math.abs(shot.x - (fall.x + speed * Math.cos(heading))) < 1, 'ahead at its speed')
  assert.ok(Math.abs(shot.y - (fall.y + speed * Math.sin(heading))) < 1)
  assert.equal(shot.angle, fall.angle, 'without turning')
  const { flight } = flying.controller
  assert.equal(flying.x, flight.position(flight.age).x, 'the other plane keeps to its path')
})

/* V3-01 · a formation shot down to the last plane */

/** A pair of fighters on the screen, with every power-up drop written down. */
function createPair() {
  const world = createWorld([{ at: 0, formation: 'pair', path: 'straight', x: .5 }])
  const drops = []
  world.waves.onFormationDown = position => drops.push(position)
  world.play(1.5)
  return { ...world, drops }
}

test('a formation shot down to the last plane drops one power-up where that plane fell', () => {
  const { waves, play, drops } = createPair()
  const [first, last] = waves.enemies

  first.die()
  play(.5)
  assert.equal(drops.length, 0, 'not while a plane of it flies')

  last.die()
  play(1 / 60)
  assert.equal(drops.length, 1)
  assert.ok(Math.hypot(drops[0].x - last.x, drops[0].y - last.y) < 10)

  play(1)
  assert.equal(drops.length, 1, 'only once')
})

test('a formation with a plane that got away drops no power-up, and neither does a single plane', () => {
  const { waves, play, drops } = createPair()
  waves.enemies[0].die()
  play(10)
  assert.equal(drops.length, 0)

  const single = createWorld([{ at: 0, path: 'straight', x: .5 }])
  single.waves.onFormationDown = position => drops.push(position)
  single.play(1)
  single.waves.enemies[0].die()
  single.play(1)
  assert.equal(drops.length, 0)
})

/* the result */

test('after the result of a vis game no new wave comes and no plane scores', async t => {
  const { default: Vis } = await import('/scenes/vis/Main.js')
  const scene = new Vis()
  scene.init()
  scene.session.start()
  scene.waves.schedule = [{ at: 1, path: 'straight', x: .5 }]
  t.after(() => {
    scene.clear = () => {} // happy-dom has no 2D canvas
    scene.end()
  })
  const fighter = new Enemy({ session: scene.session })
  fighter.die()

  scene.defeat()
  for (let i = 0; i < 120; i++) {
    scene.session.update(1 / 60)
    scene.update(1 / 60, i / 60)
  }
  scene.player.scoreIfDown(fighter)
  assert.deepEqual(scene.waves.enemies, [])
  assert.equal(scene.player.poeni, 0)
})

/* V2-04 · boss */

test('the boss sways across the upper half with its nose down, and flies away if it is not shot down in time', () => {
  const { scene, waves } = createWorld([])
  const plane = waves.bossPlane(scene.session)
  const live = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      scene.session.update(1 / 60)
      plane.update(1 / 60, 0)
    }
  }
  const xs = []
  for (let i = 0; i < 15; i++) {
    live(1)
    xs.push(plane.x)
  }
  assert.ok(plane.y > 0 && plane.y < canvas2d.height / 2, 'in the upper half')
  assert.ok(Math.max(...xs) - Math.min(...xs) > canvas2d.width * .3, 'left and right')
  assert.equal(plane.angle, Math.PI)

  live(boss.timeLimit - 16)
  assert.equal(plane.gone, false, 'not before its time')
  live(10)
  assert.equal(plane.gone, true, 'up and away')
})

test('the boss comes after the last wave, and the level ends only when it is down', () => {
  const { waves, play } = createWorld([{ at: 0, path: 'straight', x: .5 }, { at: 1, enemy: 'boss' }])

  play(1.1)
  const { boss } = waves
  assert.ok(boss, 'the boss is in')
  play(15)
  assert.equal(waves.finished, false, 'the boss is still flying')
  assert.ok(boss.y > 0 && boss.y < canvas2d.height / 2, 'in the upper half')

  boss.damage(settings.enemies.boss.hits)
  play(enemy.fallTime + .1)
  assert.equal(waves.finished, true)
})

test('in the vis game the boss is the end: the victory comes only after it is down', async t => {
  const { default: Vis } = await import('/scenes/vis/Main.js')
  const scene = new Vis()
  scene.init()
  scene.session.start()
  scene.stage = 2 // the last stage
  scene.waves.schedule = [{ at: 0, enemy: 'boss' }]
  t.after(() => {
    scene.clear = () => {} // happy-dom has no 2D canvas
    scene.end()
  })
  const play = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      scene.session.update(1 / 60)
      scene.update(1 / 60, i / 60)
    }
  }

  play(10)
  assert.equal(scene.ui.outro, '', 'no victory while the boss flies')
  scene.waves.boss.damage(settings.enemies.boss.hits)
  play(enemy.fallTime + settings.landingTime + .5)
  assert.match(scene.ui.outro, /reached the island of Vis/)
})

test('in the vis game the first two stages end at an airfield, where the sirens send the plane on to the next', async t => {
  const { default: Vis } = await import('/scenes/vis/Main.js')
  const { levels } = await import('/scenes/vis/levels.js')
  const scene = new Vis()
  scene.init()
  scene.session.start()
  t.mock.method(scene.ui, 'showMessage')
  t.after(() => {
    scene.clear = () => {} // happy-dom has no 2D canvas
    scene.end()
  })
  const play = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      scene.session.update(1 / 60)
      scene.update(1 / 60, i / 60)
    }
  }
  assert.equal(levels.length, 3)
  scene.waves.schedule = []
  play(settings.landingTime + .5)
  assert.equal(scene.stage, 1, 'the second stage begins')
  assert.equal(scene.ui.outro, '', 'no victory at an airfield on the way')
  assert.equal(scene.ui.showMessage.mock.calls[0].arguments[0], 'Sirens! The enemy is attacking the base!')
  assert.equal(scene.waves.schedule, levels[1])
  assert.equal(scene.baza.leaving, true, 'the plane takes off as the airfield scrolls away')
})
