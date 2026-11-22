import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let continueWithMission, missions, layout, raids, plane, airspeed, FranjoKluzScene, Flak, Rifleman, Sentry, Gunner

/** Pixels a metre in the scene. */
const P = 30.8

before(async() => {
  createPageElements()
  ;({ plane, airspeed } = await import('/core/gameplay/bodies/aircraft/Potez.js'))
  ;({ default: Flak } = await import('/core/gameplay/bodies/artillery/Flak.js'))
  ;({ default: Rifleman } = await import('/core/gameplay/bodies/soldiers/Rifleman.js'))
  ;({ default: Sentry } = await import('/core/gameplay/controllers/Sentry.js'))
  ;({ default: Gunner } = await import('/core/gameplay/controllers/Gunner.js'))
  ;({ missions } = await import('/scenes/franjo-kluz/missions.js'))
  ;({ enemies: layout, raids } = missions[0])
  ;({ default: FranjoKluzScene, continueWithMission } = await import('/scenes/franjo-kluz/Main.js'))
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** The scene of `mission`: by default the first, which starts in the air with enemies of every kind. */
function createScene(t, { mission = 0, manager = {} } = {}) {
  continueWithMission(mission)
  const scene = new FranjoKluzScene(manager)
  scene.init()
  scene.clear = () => {}
  scene.session.start()
  t.after(() => scene.end())
  return scene
}

/** The first enemy of `kind` in the first mission: its body and its view. */
const enemyOf = (scene, kind) => scene.enemies[layout.findIndex(item => item.kind === kind)]

test('the integrated Hummel can fire on command without joining the mission anti-aircraft controllers', t => {
  const scene = createScene(t)
  const { body } = enemyOf(scene, 'tank')
  assert.ok(body.states.includes('fire'))
  assert.equal(scene.armed.includes(body), false)
  scene.openFire(scene.armed)
  assert.equal(scene.controllers.some(controller => controller.body === body && controller instanceof Gunner), false)
  assert.equal(body.shoot(), true)
  assert.equal(body.shotsFired, 1)
})

const play = (scene, seconds) => {
  for (let i = 0; i < seconds * 30; i++) {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
}

/** Where the plane is on the screen. */
const screenOf = scene => {
  const { x, y } = scene.projection.point(scene.player)
  return { x: x - scene.cameraX, y: y - scene.cameraY }
}

test('a soldier falls to one bullet, the armoured train only to many, and one bomb destroys any enemy', t => {
  const scene = createScene(t)
  const soldier = enemyOf(scene, 'soldier').body
  soldier.takeHit(15)
  assert.equal(soldier.state, 'dead')
  const train = enemyOf(scene, 'train').body
  let hits = 0
  while (train.alive) {
    train.takeHit(15)
    hits++
  }
  assert.ok(hits > 10)
  const truck = enemyOf(scene, 'truck').body
  scene.destroyAround({ x: truck.x, y: 0 })
  assert.equal(truck.dead, true)
  assert.equal(enemyOf(scene, 'flak').body.alive, true, 'far from the blast')
})

test('the camera keeps the plane in view at every height and never shows below the ground', t => {
  const scene = createScene(t)
  const fly = (seconds, steer) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer?.(1 / 30)
      scene.update(1 / 30, i / 30)
      const { x, y } = screenOf(scene)
      assert.ok(x > 0 && x < scene.width && y > 0 && y < scene.height, `plane at ${x}, ${y}`)
      assert.ok(scene.cameraY <= 0)
    }
  }
  fly(5, dt => scene.player.speedUp(dt))
  fly(5, dt => scene.player.slowDown(dt))
  scene.player.y = 142.86
  fly(1)
  scene.player.y = 2.14
  fly(1 / 30)
  assert.equal(scene.cameraY, 0, 'near the ground the view rests on it')
})

test('the airfield stays at its place in the world while the plane flies on', t => {
  const scene = createScene(t)
  const airfieldX = scene.aerodrom.x
  for (let i = 0; i < 90 * 30; i++) {
    scene.player.y = 14.29 // it flies level
    play(scene, 1 / 30)
  }
  assert.equal(scene.aerodrom.x, airfieldX)
  assert.ok(scene.cameraX > airfieldX, 'the plane has flown past it')
})

test('right moves the plane forward across the screen and speeds the flight up; left moves it back and slows it', t => {
  const scene = createScene(t)
  const hold = (steer, seconds) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer(1 / 30)
      scene.update(1 / 30, i / 30)
    }
  }
  const startX = screenOf(scene).x
  hold(dt => scene.player.speedUp(dt), 1)
  assert.ok(screenOf(scene).x > startX + 100, 'forward')
  assert.ok(scene.player.airspeed > airspeed.start + 2.86, 'faster')
  const forwardX = screenOf(scene).x, fastSpeed = scene.player.airspeed
  hold(dt => scene.player.slowDown(dt), 1)
  assert.ok(screenOf(scene).x < forwardX - 100, 'back')
  assert.ok(scene.player.airspeed < fastSpeed - 2.86, 'slower')
})

test('the plane is drawn in front of the buildings, the enemies and the raiders it can crash into', t => {
  // views of the same depth are drawn in the order of the scene's children (happy-dom has no 2D canvas)
  const scene = createScene(t)
  scene.enterRaider(scene.raiders[0], { fromBehind: false })
  const order = scene.children
  const { playerView } = scene
  for (const view of [scene.aerodrom, scene.ruina, ...scene.enemies.map(({ view }) => view), scene.raiders[0].view]) {
    assert.equal(view.position.z, playerView.position.z)
    assert.ok(order.indexOf(view) < order.indexOf(playerView))
  }
})

test('the defeat screen comes only after the shot down plane has crashed and been seen', t => {
  const scene = createScene(t)
  scene.player.setState('dead')
  let i = 0
  while (!scene.player.wrecked && i < 300) {
    play(scene, 1 / 30)
    i++
  }
  assert.equal(scene.player.wrecked, true, 'it reached the ground')
  assert.equal(scene.ui.outro, '', 'the crash is seen before the defeat screen')
  play(scene, 2)
  assert.match(scene.ui.outro, /Game over/)
})

/**
 * The last mission, whose landing wins the game, with the sizes the images would give and the plane just above the
 * ground at `x` pixels, flying at `speed` and sinking at `sink` metres a second.
 */
function approach(t, x, { speed = 8.14, sink = 1.64 } = {}) {
  const scene = createScene(t, { mission: missions.length - 1 })
  const { player, aerodrom } = scene
  for (const { body } of scene.raiders) body.setState('dead') // in an air raid landing wins only once they are shot down
  for (const airfield of scene.airfields) airfield.width = 400
  const runwayX = x(aerodrom.runway)
  player.x = runwayX / P
  player.y = scene.groundAt(player.x) + player.size.height / 2 + .05
  player.setState('move')
  scene.cameraX = runwayX - 200
  player.airspeed = speed
  player.vy = -sink
  return scene
}

test('a slow landing on the runway wins, and says how soft it was', t => {
  const soft = approach(t, runway => runway.left + 100)
  play(soft, 3)
  assert.match(soft.ui.outro, /Mission successfully completed! A soft landing/)

  const hard = approach(t, runway => runway.left + 100, { sink: 8.14 })
  play(hard, 3)
  assert.match(hard.ui.outro, /A hard landing/)
})

test('touching the ground off the runway or too fast wrecks the plane', t => {
  const short = approach(t, runway => runway.left - 300)
  play(short, 1 / 15)
  assert.equal(short.player.wrecked, true, 'before the runway')

  const fast = approach(t, runway => runway.left + 100, { speed: 22.71 })
  play(fast, 1 / 15)
  assert.equal(fast.player.wrecked, true, 'too fast')
})

test('landing wins even while enemies are left, and flying past the runway loses the mission', t => {
  const early = approach(t, runway => runway.left + 100)
  play(early, 3)
  assert.ok(early.enemies.every(({ body }) => body.alive))
  assert.match(early.ui.outro, /Mission successfully completed/)

  const past = approach(t, runway => runway.right + 50)
  past.player.y += 10
  play(past, 1 / 15)
  assert.match(past.ui.outro, /You missed the airfield/)
})

test('a landing survives with the nose tipped down or up, and with down held, but not a plunge', t => {
  for (const pitch of [.07, -.07]) {
    const scene = approach(t, runway => runway.left + 100, { sink: 3.21 })
    scene.player.pitch = pitch
    play(scene, 3)
    assert.match(scene.ui.outro, /Mission successfully completed/, `pitch ${pitch}`)
  }
  const held = approach(t, runway => runway.left + 100, { speed: 17.86, sink: 9.93 })
  play(held, 3)
  assert.match(held.ui.outro, /A hard landing/)
  const plunge = approach(t, runway => runway.left + 100, { sink: 13 })
  play(plunge, 3)
  assert.equal(plunge.player.wrecked, true)
  assert.match(plunge.ui.outro, /You landed too hard/)
})

test('the plane rolls on top of the asphalt runway, not in it', t => {
  const scene = approach(t, runway => runway.left + 100)
  play(scene, 1)
  const { player } = scene
  assert.ok(Math.abs(scene.projection.point({ x: 0, y: player.y - player.size.height / 2 }).y - scene.aerodrom.surface) < 1e-6)
  assert.ok(scene.aerodrom.surface < scene.height)
})

test('the ruin never comes back over the airfield or its runway, and the plane crashes into it where it stands', t => {
  const scene = createScene(t)
  const { aerodrom, ruina, ruinBody } = scene
  aerodrom.width = 400
  ruina.width = 300
  ruina.height = 200
  for (let i = 0; i < 200; i++) {
    scene.cameraX = aerodrom.x - 3000 + i * 20
    ruina.x = scene.cameraX - 1000
    scene.returnRuin()
    const clear = ruina.x - ruina.width / 2 > aerodrom.runway.right || ruina.x + ruina.width / 2 < aerodrom.x - aerodrom.width / 2
    assert.ok(clear, `ruin at ${ruina.x}`)
    assert.ok(Math.abs(ruinBody.x * P - ruina.x) < 1e-6)
  }
  assert.ok(scene.solids.includes(ruinBody), 'in the first missions it is solid')
  assert.equal(createScene(t, { mission: 2 }).solids.some(body => body === scene.ruinBody), false)
})

test('the corner shows the plane health, then rounds left above bombs left', t => {
  const scene = createScene(t)
  scene.player.takeHit(plane.health * .6)
  scene.player.bombs = 2
  scene.player.ammo = 37
  const hud = scene.sceneUI()
  assert.match(hud, /💣💣\s/)
  assert.match(hud, /items\/granata\.gif" alt="Rounds" width="32" height="8"> 37/)
  assert.ok(hud.indexOf('Rounds') < hud.indexOf('💣'), 'rounds first')
  assert.match(hud, /<progress[^>]*value="40"/)
  assert.ok(hud.indexOf('<progress') < hud.indexOf('Rounds'), 'health on top')
})

test('soldiers face the plane, which comes from the left, and vehicles drawn that way stay as they are', t => {
  const scene = createScene(t)
  for (const kind of ['soldier', 'assault']) {
    assert.equal(enemyOf(scene, kind).body.forward, -1)
    assert.equal(enemyOf(scene, kind).view.flipY, -1)
  }
  assert.equal(enemyOf(scene, 'truck').body.forward, -1)
  assert.equal(enemyOf(scene, 'truck').view.flipY, 1)
})

test('each fighter comes once, head on from the right of the view or from behind on the left', t => {
  const scene = createScene(t)
  const headOn = raids.findIndex(pass => !pass.fromBehind)
  const behind = raids.findIndex(pass => pass.fromBehind)
  scene.raidersSent = headOn
  scene.cameraX = raids[headOn].x - scene.width
  scene.sendRaiders()
  const first = scene.raiders[headOn].body
  assert.ok(scene.inPlay.has(first))
  assert.ok(first.x * P > scene.cameraX + scene.width, 'it enters at the right')
  scene.update(1 / 30, 0)
  assert.ok(first.vx < 0, 'it flies left, against the plane')

  scene.raidersSent = behind
  scene.cameraX = raids[behind].x
  scene.sendRaiders()
  const chaser = scene.raiders[behind].body
  assert.ok(chaser.x * P < scene.cameraX, 'it enters behind, at the left')
  scene.update(1 / 30, 0)
  assert.ok(chaser.vx > scene.player.vx, 'it overtakes the plane')
  scene.sendRaiders()
  assert.equal(scene.raidersSent, behind + 1, 'once')
})

test('a fighter crash destroys the enemies on the ground around it', t => {
  const scene = createScene(t)
  const raider = scene.raiders[0]
  const truck = enemyOf(scene, 'truck').body
  const train = enemyOf(scene, 'train').body
  scene.enterRaider(raider, { fromBehind: false })
  Object.assign(raider.body, { x: truck.x + 2.14, y: 4.29 })
  raider.body.setState('dead')
  for (let i = 0; i < 30 * 5 && !raider.body.crashed; i++) raider.body.update(1 / 30)
  assert.equal(raider.body.crashed, true)
  assert.equal(truck.dead, true, 'the truck under it burns')
  assert.equal(train.alive, true, 'far away')
})

test('the observer fires back on his own at a fighter behind the plane, not at one ahead, and the fire key fires only the front gun', t => {
  const scene = createScene(t)
  const { player } = scene
  const [behind, ahead] = scene.raiders
  scene.enterRaider(ahead, { fromBehind: false })
  scene.enterRaider(behind, { fromBehind: true })
  Object.assign(ahead.body, { x: player.x + 10, y: player.y })
  Object.assign(behind.body, { x: player.x - 8.57, y: player.y + 1.43 })
  scene.update(1 / 30, 0)
  assert.equal(player.rearTarget, behind.body)
  assert.equal(player.rearBullets.projectiles.length, 1, 'on his own')
  assert.ok(player.rearBullets.projectiles[0].vx < player.vx, 'the round flies back')
  assert.equal(player.shotsFired, 1, 'the front gun keeps quiet')
  key('keydown', 'Space')
  scene.handleInput(1 / 30)
  key('keyup', 'Space')
  assert.equal(player.bullets.projectiles.length, 1, 'the fire key fires the front gun')
  assert.equal(player.rearBullets.projectiles.length, 1, 'and not the observer, who waits for his reload')
})

test('the second mission starts standing on a runway, takes off with up, and has no fighters', t => {
  const scene = createScene(t, { mission: 1 })
  const { player } = scene
  for (const airfield of scene.airfields) airfield.width = 780 // the images do not load in tests
  assert.equal(scene.raiders.length, 0)
  play(scene, 1)
  assert.equal(player.isGrounded, true)
  assert.ok(scene.airfieldAt(player.x), 'on a runway')
  assert.equal(player.alive, true, 'standing on the runway is no crash')
  assert.equal(scene.ui.outro, '', 'nor a win')
  for (let i = 0; i < 30; i++) {
    player.climb(1 / 30) // up held for a second
    play(scene, 1 / 30)
  }
  assert.equal(player.isGrounded, false, 'it has taken off')
})

test('landing at the end of the first mission goes on to the second, and only the last mission wins the game', t => {
  const started = []
  const scene = createScene(t, { mission: 0, manager: { start: path => started.push(path) } })
  const { player, aerodrom } = scene
  aerodrom.width = 400
  player.x = (aerodrom.runway.left + 100) / P
  player.y = scene.groundAt(player.x) + player.size.height / 2 + .05
  scene.cameraX = player.x * P - 200
  player.airspeed = 11.4
  player.vy = -2.3
  play(scene, 3)
  assert.match(scene.ui.message, /You joined the partisans/)
  assert.equal(scene.ui.outro, '', 'no end screen between missions')
  play(scene, 2)
  assert.deepEqual(started, ['franjo-kluz'])
  const scenes = [new FranjoKluzScene({}), new FranjoKluzScene({})]
  t.after(() => scenes.forEach(next => next.end()))
  scenes.forEach(next => {
    next.init()
    next.clear = () => {} // happy-dom has no 2D canvas to draw the sky on
  })
  assert.equal(scenes[0].missionIndex, 1, 'the next scene flies the second mission')
  assert.equal(scenes[1].missionIndex, 0, 'a new game starts with the first')
})

test('in NDH markings the plane fools the enemy until half way, then all of it opens fire; the second mission is on alert at once', t => {
  const scene = createScene(t)
  const { player, aerodrom } = scene
  const gun = scene.enemies.map(({ body }) => body).find(body => body instanceof Flak)
  const soldier = scene.enemies.map(({ body }) => body).find(body => body instanceof Rifleman)
  const shooters = [gun, soldier]
  const fires = () => {
    for (const shooter of shooters) shooter.reload.start(0)
    // the view keeps the plane in it
    const over = body => {
      Object.assign(player, { x: body.x, y: 14 })
      scene.cameraX = body.x * P - 300
    }
    over(gun)
    scene.update(1 / 30, 0) // the gunners aim
    gun.trainBarrel(10) // and the barrel turns onto the plane
    scene.update(1 / 30, 0)
    over(soldier)
    scene.update(1 / 30, 0)
    scene.update(1 / 30, 0)
    return shooters.map(shooter => shooter.shotsFired > 0)
  }
  const [siren] = scene.siren.sounds
  let wails = 0
  siren.play = () => wails++
  player.x = 0
  assert.deepEqual(shooters.map(shooter => scene.alerted.has(shooter)), [false, false], 'fooled')
  assert.deepEqual(fires(), [false, false], 'fooled, they do not fire')
  assert.equal(scene.alarm.raised, false)
  player.x = aerodrom.x / 2 / P
  scene.soundAlarm()
  scene.raiseAlarm()
  assert.equal(wails, 1, 'the siren wails once, when the alarm is raised')
  assert.deepEqual(shooters.map(shooter => scene.alerted.has(shooter)), [true, true], 'on alert')
  assert.deepEqual(fires(), [true, true], 'on alert, they fire')

  const second = createScene(t, { mission: 1 })
  assert.equal(second.alarm.raised, true)
  assert.ok(second.armed.every(body => second.alerted.has(body)))
})

test('before the siren an attack alerts only the enemies in view, and those who come into view join a fight but not a calm', t => {
  const scene = createScene(t)
  const bodies = scene.enemies.map(({ body }) => body)
  for (const body of bodies) body.x = -5000 // out of the way
  const [near, beside, ahead, later] = bodies.filter(body => body instanceof Rifleman)
  scene.cameraX = 900
  near.x = 1000 / P
  beside.x = 1200 / P
  ahead.x = later.x = (1000 + scene.width * 3) / P

  scene.alertInView()
  assert.equal(scene.alerted.has(near), false, 'all is calm: they see their own plane')
  scene.player.shoot()
  scene.watchAttacks()
  assert.deepEqual([near, beside, ahead].map(body => scene.alerted.has(body)), [true, true, false], 'the attack is seen only in view')
  assert.equal(scene.alarm.raised, false, 'no siren')

  ahead.x = 1300 / P
  scene.alertInView()
  assert.equal(scene.alerted.has(ahead), true, 'he comes into a fight')

  for (const body of [near, beside, ahead]) body.setState('dead')
  later.x = 1300 / P
  scene.alertInView()
  assert.equal(scene.alerted.has(later), false, 'he comes into a calm')
})

test('every soldier keeps watch as a sentry until he is alerted, when a gunner takes over', t => {
  const scene = createScene(t)
  const soldiers = scene.enemies.map(({ body }) => body).filter(body => body instanceof Rifleman)
  const watched = scene.controllers.filter(controller => controller instanceof Sentry).map(controller => controller.body)
  assert.deepEqual(watched, soldiers)
  scene.openFire([soldiers[0]])
  const controlling = scene.controllers.filter(controller => controller.body === soldiers[0])
  assert.deepEqual(controlling.map(controller => controller.constructor), [Gunner])
})

test('the plane flies the first mission in NDH markings and the second in partisan ones', t => {
  assert.match(createScene(t).playerView.image.src, /potez-25-ndh-[^/]*\.png$/)
  assert.match(createScene(t, { mission: 1 }).playerView.image.src, /potez-25-partisan-[^/]*\.png$/)
})

/** The air raid, the last mission, with the sizes the images would give and the plane standing on the runway. */
function airRaid(t) {
  const scene = createScene(t, { mission: missions.length - 1 })
  for (const airfield of scene.airfields) airfield.width = 780
  return scene
}

test('the air raid starts standing on the runway under the siren, with the alarm raised', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  assert.equal(scene.mission.airRaid, true)
  assert.equal(scene.player.isGrounded, true)
  assert.ok(scene.airfieldAt(scene.player.x), 'on a runway')
  assert.equal(scene.alarm.raised, true)
  assert.ok(scene.armed.every(body => scene.alerted.has(body)))
  assert.equal(scene.siren.sounds[0].autoplay, true, 'the siren wails from the start')
  for (const mission of [0, 1]) assert.equal(createScene(t, { mission }).siren.sounds[0].autoplay, false)
})

test('in the air raid one Ju 87 comes first and bombs the plane that stays on the ground', t => {
  const scene = airRaid(t)
  const [first, second] = scene.mission.raids
  assert.equal(first.kind, 'diveBomber')
  assert.ok(second.x > 0, 'the second raider comes later on the way')
  let seconds = 0
  while (scene.player.alive && seconds < 15) {
    play(scene, 1 / 30)
    seconds += 1 / 30
  }
  assert.equal(scene.player.dead, true, 'a bomb burst destroys it')
  assert.ok(seconds > 3 && seconds < 10, `after ${seconds.toFixed(1)} s`)
  play(scene, 3)
  assert.match(scene.ui.outro, /The bombs caught you on the ground/)
})

test('a bomb burst destroys the plane on the ground, not in the air or far from it', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  const { player } = scene
  scene.bombGround({ x: player.x + 45, y: 0 })
  assert.equal(player.alive, true, 'far from it')
  player.y += 5
  scene.bombGround({ x: player.x, y: 0 })
  assert.equal(player.alive, true, 'in the air')
  player.y -= 5
  scene.bombGround({ x: player.x + 4.5, y: 0 })
  assert.equal(player.dead, true, 'on the ground')
})

test('a shot down raider wreck damages the plane once, a live raider destroys it', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  const [raider] = scene.raiders
  const { player } = scene
  Object.assign(raider.body, { x: player.x, y: player.y })
  raider.body.setState('dead')
  player.checkCollisions()
  player.checkCollisions()
  assert.equal(player.alive, true)
  assert.equal(player.health.current, plane.health - plane.wreckDamage, 'hit once')

  const live = airRaid(t)
  play(live, 1 / 30)
  const [next] = live.raiders
  Object.assign(next.body, { x: live.player.x, y: live.player.y })
  live.player.checkCollisions()
  assert.equal(live.player.dead, true)
})

test('in the air raid a raider not shot down comes back from the other side; in the first mission it does not', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  const [raider] = scene.raiders
  assert.ok(scene.inPlay.has(raider.body), 'the first raider has come')
  assert.equal(raider.fromBehind, false)
  scene.cameraX = raider.body.x * P + 5000 // it has flown far past the view
  play(scene, 1 / 15)
  assert.ok(scene.inPlay.has(raider.body), 'it is back')
  assert.equal(raider.fromBehind, true, 'from behind')
  assert.ok(raider.body.x * P < scene.cameraX, 'on the left')
  raider.body.setState('dead')
  play(scene, 10)
  assert.equal(raider.body.crashed, true)
  assert.equal(scene.targets.includes(raider.body), false, 'its wreck fights no more')

  const first = createScene(t)
  first.cameraX = first.mission.raids[0].x - first.width
  play(first, 1 / 30)
  const fighter = first.raiders[0].body
  assert.ok(first.inPlay.has(fighter))
  first.cameraX = fighter.x * P + 5000
  play(first, 1)
  assert.equal(first.inPlay.has(fighter), false, 'gone for good')
})

test('in the air raid landing wins only once no raider is left', t => {
  const scene = airRaid(t)
  const { player, aerodrom } = scene
  const kept = scene.raiders[scene.mission.raids.findIndex(raid => raid.kind === 'fighter')].body
  for (const { body } of scene.raiders) if (body !== kept) body.setState('dead')
  scene.release(kept, Gunner) // it does not fire on the landing plane
  player.x = (aerodrom.runway.left + 100) / P
  player.y = scene.groundAt(player.x) + player.size.height / 2 + .05
  player.setState('move')
  scene.cameraX = player.x * P - 200
  player.airspeed = 11.4
  player.vy = -2.3
  // the observer holds his fire, so the raider stays
  player.canFireBackAt = () => false
  play(scene, 3)
  assert.equal(player.alive, true)
  assert.ok(player.airspeed < 1, 'it has stopped on the runway')
  assert.equal(scene.ui.outro, '', 'one raider is left')
  kept.setState('dead')
  play(scene, 1)
  assert.match(scene.ui.outro, /Mission successfully completed/)
})

test('the far clouds are drawn behind the groves and the plane, so they never hide it', t => {
  const scene = createScene(t)
  const [groves, clouds] = scene.scenery
  // the renderer draws the farther, higher z first
  assert.ok(clouds.depth < groves.depth, 'the clouds are the farthest layer')
  assert.ok(clouds.position.z > groves.position.z)
  assert.ok(clouds.position.z > scene.playerView.position.z)
})
