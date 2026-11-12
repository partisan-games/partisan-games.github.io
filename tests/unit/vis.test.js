import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import * as timers from '/core/timers.js'

let Enemy, Waves, paths, formationMembers, settings, platno

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }
  }
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Waves = (await import('/scenes/vis/Waves.js')).default
  ;({ paths } = await import('/scenes/vis/paths.js'))
  ;({ formationMembers } = await import('/scenes/vis/formations.js'))
  ;({ settings } = await import('/scenes/vis/settings.js'))
  platno = (await import('/core/io/platno.js')).default
})

/** A stand-in for the scene and the player: only what Waves and the enemy planes use. */
function createWorld(schedule) {
  const scene = { predmeti: [], add(...planes) {
    this.predmeti.push(...planes)
  }, remove(...planes) {
    this.predmeti = this.predmeti.filter(plane => !planes.includes(plane))
  } }
  const player = { x: platno.width / 2, y: platno.height - 50, alive: true, ciljevi: [] }
  const waves = new Waves({ scene, player, schedule })
  /** Plays the level as the scene does: the game clock, the planes, then the waves. */
  const play = (seconds, fps = 60) => {
    for (let i = 0; i < seconds * fps; i++) {
      timers.update(1 / fps)
      scene.predmeti.forEach(plane => plane.update(1 / fps, waves.time))
      waves.update(1 / fps)
    }
  }
  return { scene, player, waves, play }
}

/* V1-02 · waves */

test('a wave comes at its time, and a shot down plane leaves the scene and the player\'s targets after its fall', () => {
  timers.clear()
  const { scene, player, waves, play } = createWorld([{ at: 2, path: 'straight', x: .5 }])

  play(1.9)
  assert.equal(scene.predmeti.length, 0, 'not before its time')
  play(.2)
  assert.equal(scene.predmeti.length, 1)
  assert.deepEqual(player.ciljevi, scene.predmeti)

  const [plane] = waves.enemies
  plane.umri()
  play(settings.fallTime - .1)
  assert.equal(scene.predmeti.length, 1, 'still falling')
  play(.2)
  assert.equal(scene.predmeti.length, 0)
  assert.deepEqual(player.ciljevi, [])
  assert.equal(waves.finished, true, 'the level is over after the last wave')
})

test('a plane that flies across the screen and out is gone, and the level ends after the last wave', () => {
  timers.clear()
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
      const plane = new Enemy({ path: name, x: .5, y: .1, side: 'left' })
      for (let i = 0; i < seconds * fps; i++) plane.fly(1 / fps)
      return { x: plane.x, y: plane.y }
    }
    const at60 = positionAfter(2, 60), at30 = positionAfter(2, 30)

    assert.ok(Math.abs(at60.x - at30.x) < .01 && Math.abs(at60.y - at30.y) < .01, `${JSON.stringify(at60)} and ${JSON.stringify(at30)}`)
    assert.ok(at60.x >= 0 && at60.x <= platno.width && at60.y >= 0 && at60.y <= platno.height, `on the screen after 2 s: ${JSON.stringify(at60)}`)
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
  timers.clear()
  const { waves, play } = createWorld([{ at: 0, formation: 'line', count: 3, path: 'straight', x: .5 }])
  play(2)
  const xs = waves.enemies.map(plane => Math.round(plane.x))
  const middle = Math.round(platno.width / 2)
  assert.deepEqual(xs, [middle - settings.formationGap, middle, middle + settings.formationGap])
})

test('a shot down plane leaves its formation and goes on straight ahead, while the others fly on', () => {
  timers.clear()
  const { waves, play } = createWorld([{ at: 0, formation: 'line', count: 2, path: 'wave', x: .5 }])
  play(1)
  const [shot, flying] = waves.enemies
  shot.umri()
  const fall = { x: shot.x, y: shot.y, ugao: shot.ugao }
  const { speed } = settings.enemies.fighter

  play(1)

  const heading = fall.ugao - Math.PI / 2
  assert.ok(Math.abs(shot.x - (fall.x + speed * Math.cos(heading))) < 1, 'ahead at its speed')
  assert.ok(Math.abs(shot.y - (fall.y + speed * Math.sin(heading))) < 1)
  assert.equal(shot.ugao, fall.ugao, 'without turning')
  assert.equal(flying.x, flying.routePosition(flying.age).x, 'the other plane keeps to its path')
})

/* V2-02 · enemy types */

test('a heavy plane takes five hits and its points come with the last one; a fighter falls from one', async() => {
  timers.clear()
  const { player, waves } = createWorld([])
  waves.launch({ enemy: 'heavy', path: 'boss' })
  waves.launch({ path: 'boss' })
  const [heavy, fighter] = waves.enemies
  // a plane's flame comes in a module of its own, loaded when the plane is made
  for (let i = 0; i < 100 && !heavy.zapaljiv; i++) await new Promise(resolve => {
    setTimeout(resolve, 10)
  })

  for (let i = 0; i < 4; i++) heavy.reagujNaPogodak(15)
  assert.equal(heavy.alive, true, 'four hits')
  assert.equal(heavy.zapaljen, true, 'on fire after half of its hits')
  heavy.reagujNaPogodak(15)
  assert.equal(heavy.alive, false, 'down at the fifth')

  fighter.reagujNaPogodak(15)
  assert.equal(fighter.alive, false)
  assert.equal(heavy.points, 500)
  assert.equal(fighter.points, 100)
  assert.equal(player.ciljevi.length, 2)
})

test('the player scores a plane\'s points when it goes down, not for every hit', async t => {
  const { Avionce } = await import('/scenes/vis/Avionce.js')
  const player = new Avionce()
  t.after(() => player.end())
  const heavy = new Enemy({ type: 'heavy', path: 'boss' })
  player.ciljevi = [heavy]
  const hit = () => {
    const bullet = player.novMetak()
    bullet.pokazi()
    bullet.proveriPogodak = (target, callback) => bullet.povredi(target, callback)
    player.proveriPogodak(heavy, () => player.scoreIfDown(heavy))
    bullet.reset()
  }

  for (let i = 0; i < 4; i++) hit()
  assert.equal(player.poeni, 0)
  hit()
  assert.equal(player.poeni, 500)
})

/* V2-03 · aimed fire */

test('an enemy plane shoots at where the player is, and a shot down one does not shoot', () => {
  timers.clear()
  const { player, waves } = createWorld([])
  waves.launch({ path: 'boss' })
  const [plane] = waves.enemies
  plane.x = platno.width / 2
  plane.y = platno.height / 4
  player.x = platno.width / 4
  player.y = platno.height * .8

  plane.fireTimer = 0
  plane.shoot(1 / 60)
  const bullet = plane.meci.find(shot => shot.vidljiv)
  const aim = Math.atan2(player.y - plane.y, player.x - plane.x)
  const flight = Math.atan2(bullet.dy, bullet.dx)
  assert.ok(Math.abs(flight - aim) < .05, `aimed at ${aim}, flies at ${flight}`)

  plane.meci.forEach(shot => shot.reset())
  plane.umri()
  plane.fireTimer = 0
  plane.update(1 / 60, 0)
  assert.equal(plane.meci.filter(shot => shot.vidljiv).length, 0)
})

/* V2-04 · boss */

test('the boss comes after the last wave, and the level ends only when it is down', () => {
  timers.clear()
  const { waves, play } = createWorld([{ at: 0, path: 'straight', x: .5 }, { at: 1, enemy: 'boss' }])

  play(1.1)
  const { boss } = waves
  assert.ok(boss, 'the boss is in')
  play(15)
  assert.equal(waves.finished, false, 'the boss is still flying')
  assert.ok(boss.y > 0 && boss.y < platno.height / 2, 'in the upper half')

  boss.damage(settings.enemies.boss.hits)
  play(settings.fallTime + .1)
  assert.equal(waves.finished, true)
})

test('the boss flies away if it is not shot down in time', () => {
  timers.clear()
  const { waves, play } = createWorld([{ at: 0, enemy: 'boss' }])
  play(settings.enemies.boss.timeLimit - 1)
  assert.equal(waves.finished, false)
  play(10)
  assert.equal(waves.finished, true)
})

test('in the vis game the boss is the end: the victory comes only after it is down', async t => {
  timers.clear()
  const { default: Vis } = await import('/scenes/vis/Main.js')
  const scene = new Vis()
  scene.init()
  scene.waves.schedule = [{ at: 0, enemy: 'boss' }]
  t.after(() => {
    scene.clear = () => {} // happy-dom has no 2D canvas
    scene.end()
  })
  const play = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      timers.update(1 / 60)
      scene.update(1 / 60, i / 60)
    }
  }

  play(10)
  assert.equal(scene.ui.outro, '', 'no victory while the boss flies')
  scene.waves.boss.damage(settings.enemies.boss.hits)
  play(settings.fallTime + settings.landingTime + .5)
  assert.match(scene.ui.outro, /reached the island of Vis/)
})
