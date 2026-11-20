import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let continueWithMission, missions, Rifleman, plane, rearGun, raids, Flak, layout, airspeed, FranjoKluzScene

before(async() => {
  createPageElements()
  ;({ plane, rearGun, airspeed } = await import('/scenes/franjo-kluz/Potez.js'))
  ;({ default: Flak } = await import('/core/actor/artillery/Flak.js'))
  ;({ missions } = await import('/scenes/franjo-kluz/missions.js'))
  ;({ enemies: layout, raids } = missions[0])
  ;({ default: Rifleman } = await import('/core/actor/soldiers/Rifleman.js'))
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

test('a soldier falls to one bullet, the armoured train only to many, and one bomb destroys any enemy', t => {
  const scene = createScene(t)
  const enemy = kind => scene.enemies[layout.findIndex(item => item.kind === kind)]
  scene.player.shoot()
  const [bullet] = scene.player.bullets.projectiles
  const hitsToDestroy = target => {
    let hits = 0
    while (target.alive && hits < 100) {
      bullet.hit(target)
      hits++
    }
    return hits
  }
  const soldier = enemy('soldier')
  assert.equal(hitsToDestroy(soldier), 1)
  assert.equal(soldier.visible, true, 'the dead soldier stays visible for the fall animation')
  assert.equal(soldier.pose, 'death')
  const train = enemy('train')
  assert.ok(hitsToDestroy(train) > 10)
  assert.equal(train.visible, true, 'a vehicle burns where it was destroyed')

  const truck = enemy('truck')
  truck.width = 200 // the image does not load in tests
  truck.height = 90
  scene.player.blast({ x: truck.x, y: truck.y })
  assert.equal(truck.dead, true)
  assert.equal(enemy('flak').alive, true, 'far from the blast')
})

test('the camera keeps the plane in view at every height and never shows below the ground', t => {
  const scene = createScene(t)
  scene.player.width = 100 // the image does not load in tests
  const fly = (seconds, steer) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer?.()
      scene.update(1 / 30, i / 30)
      assert.equal(scene.player.offScreen, false, `plane at ${scene.player.x}, ${scene.player.y}`)
      assert.ok(scene.cameraY <= 0)
    }
  }
  fly(5, () => scene.player.moveRight(1 / 30))
  fly(5, () => scene.player.moveLeft(1 / 30))
  scene.player.y = -3000
  fly(1)
  scene.player.y = scene.height - 30
  fly(1 / 30)
  assert.equal(scene.cameraY, 0, 'near the ground the view rests on it')
})

test('the airfield stays at its place in the world while the plane flies on', t => {
  const scene = createScene(t)
  const airfieldX = scene.aerodrom.x
  for (let i = 0; i < 90 * 30; i++) {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
  assert.equal(scene.aerodrom.x, airfieldX)
  assert.ok(scene.cameraX > airfieldX, 'the plane has flown past it')
})

test('right moves the plane forward across the screen and speeds the flight up; left moves it back and slows it', t => {
  const scene = createScene(t)
  scene.player.width = 100 // the image does not load in tests
  const screenX = () => scene.player.x - scene.cameraX
  const hold = (steer, seconds) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer(1 / 30)
      scene.update(1 / 30, i / 30)
    }
  }
  const startX = screenX()
  hold(dt => scene.player.moveRight(dt), 1)
  assert.ok(screenX() > startX + 100, `forward: ${startX} → ${screenX()}`)
  assert.ok(scene.player.airspeed > airspeed.start + 100, 'faster')
  const forwardX = screenX(), fastSpeed = scene.player.airspeed
  hold(dt => scene.player.moveLeft(dt), 1)
  assert.ok(screenX() < forwardX - 100, `back: ${forwardX} → ${screenX()}`)
  assert.ok(scene.player.airspeed < fastSpeed - 100, 'slower')
})

test('the plane is drawn in front of the buildings and the enemies it can crash into', t => {
  // Objects of the same depth are drawn in the order of the scene's children (happy-dom has no 2D canvas).
  const scene = createScene(t)
  const order = scene.children
  for (const body of [scene.aerodrom, scene.ruina, ...scene.enemies]) {
    assert.equal(body.position.z, scene.player.position.z)
    assert.ok(order.indexOf(body) < order.indexOf(scene.player))
  }
})

test('the defeat screen comes only after the shot down plane has crashed and been seen', t => {
  const scene = createScene(t)
  const plane = scene.player
  plane.width = 100 // the image does not load in tests
  plane.height = 40
  plane.die()
  const frame = i => {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
  let i = 0
  while (!plane.wrecked && i < 300) frame(i++)
  assert.equal(plane.wrecked, true, 'it reached the ground')
  assert.equal(scene.ui.outro, '', 'the crash is seen before the defeat screen')
  for (let j = 0; j < 60; j++) frame(i + j)
  assert.match(scene.ui.outro, /Game over/)
})

/** The last mission, whose landing wins the game, with sizes the images would give and the plane just above the ground at `x`. */
function approach(t, x, { airspeed: speed = 250, sink = 50 } = {}) {
  const scene = createScene(t, { mission: missions.length - 1 })
  const { player, aerodrom } = scene
  for (const raider of scene.raiders) raider.die() // in an air raid landing wins only once they are shot down
  for (const airfield of scene.airfields) airfield.width = 400
  player.width = 100
  player.height = 40
  const runwayX = x(aerodrom.runway)
  player.setPosition(runwayX, scene.height - player.height / 2 - 1)
  scene.cameraX = runwayX - 200
  player.airspeed = speed
  player.dy = sink
  return scene
}

const play = (scene, seconds) => {
  for (let i = 0; i < seconds * 30; i++) {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
}

test('a slow landing on the runway wins, and says how soft it was', t => {
  const soft = approach(t, runway => runway.left + 100)
  play(soft, 3)
  assert.match(soft.ui.outro, /Mission successfully completed! A soft landing/)

  const hard = approach(t, runway => runway.left + 100, { sink: 250 })
  play(hard, 3)
  assert.match(hard.ui.outro, /A hard landing/)
})

test('touching the ground off the runway or too fast wrecks the plane', t => {
  const short = approach(t, runway => runway.left - 300)
  play(short, 1 / 15)
  assert.equal(short.player.wrecked, true, 'before the runway')

  const fast = approach(t, runway => runway.left + 100, { airspeed: 700 })
  play(fast, 1 / 15)
  assert.equal(fast.player.wrecked, true, 'too fast')
})

test('landing wins even while enemies are left, and flying past the runway loses the mission', t => {
  const early = approach(t, runway => runway.left + 100)
  play(early, 3)
  assert.ok(early.enemies.every(enemy => enemy.alive))
  assert.match(early.ui.outro, /Mission successfully completed/)

  const past = approach(t, runway => runway.right + 50)
  past.player.y -= 300
  play(past, 1 / 15)
  assert.match(past.ui.outro, /You missed the airfield/)
})

test('the ruin never comes back over the airfield or its runway', t => {
  const scene = createScene(t)
  const { aerodrom, ruina } = scene
  aerodrom.width = 400
  ruina.width = 300
  for (let i = 0; i < 200; i++) {
    scene.cameraX = aerodrom.x - 3000 + i * 20
    ruina.x = scene.cameraX - 1000
    scene.returnRuin()
    const clear = ruina.x - ruina.width / 2 > aerodrom.runway.right || ruina.x + ruina.width / 2 < aerodrom.x - aerodrom.width / 2
    assert.ok(clear, `ruin at ${ruina.x}`)
  }
})

test('the plane rolls on top of the asphalt runway, not in it', t => {
  const scene = approach(t, runway => runway.left + 100)
  play(scene, 1)
  assert.equal(scene.player.y + scene.player.height / 2, scene.aerodrom.surface)
  assert.ok(scene.aerodrom.surface < scene.height)
})

test('a landing survives with the nose tipped down by the descent or up in a flare, and with down held, but not a plunge', t => {
  for (const angle of [.07, 2 * Math.PI - .07]) {
    const scene = approach(t, runway => runway.left + 100, { sink: 100 })
    scene.player.angle = angle
    play(scene, 3)
    assert.match(scene.ui.outro, /Mission successfully completed/, `angle ${angle}`)
  }
  const held = approach(t, runway => runway.left + 100, { airspeed: 550, sink: 306 })
  play(held, 3)
  assert.match(held.ui.outro, /A hard landing/)
  const plunge = approach(t, runway => runway.left + 100, { sink: 400 })
  play(plunge, 3)
  assert.equal(plunge.player.wrecked, true)
  assert.match(plunge.ui.outro, /You landed too hard/)
})

test('the corner shows the plane health, then rounds left above bombs left', t => {
  const scene = createScene(t)
  scene.player.health = plane.health * .4
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
  const enemy = kind => scene.enemies[layout.findIndex(item => item.kind === kind)]
  assert.equal(enemy('soldier').flipY, -1)
  assert.equal(enemy('assault').flipY, -1)
  assert.equal(enemy('truck').flipY, 1)
})

test('each fighter comes once, head on from the right of the view or from behind on the left', t => {
  const scene = createScene(t)
  const headOn = raids.findIndex(pass => !pass.fromBehind)
  const behind = raids.findIndex(pass => pass.fromBehind)
  scene.raidersSent = headOn
  scene.cameraX = raids[headOn].x - scene.width
  scene.sendRaiders()
  const first = scene.raiders[headOn]
  assert.equal(first.visible, true)
  assert.ok(first.x > scene.cameraX + scene.width, 'it enters at the right')
  first.update(1 / 30)
  assert.ok(first.dx < 0, 'it flies left, against the plane')

  scene.raidersSent = behind
  scene.cameraX = raids[behind].x
  scene.sendRaiders()
  const chaser = scene.raiders[behind]
  assert.ok(chaser.x < scene.cameraX, 'it enters behind, at the left')
  chaser.update(1 / 30)
  assert.ok(chaser.dx > scene.player.dx, 'it overtakes the plane')
  scene.sendRaiders()
  assert.equal(scene.raidersSent, behind + 1, 'once')
})

test('a fighter crash destroys the enemies on the ground around it', t => {
  const scene = createScene(t)
  const enemy = scene.raiders[0]
  const truck = scene.enemies[layout.findIndex(item => item.kind === 'truck')]
  const train = scene.enemies[layout.findIndex(item => item.kind === 'train')]
  for (const target of [truck, train]) {
    target.width = 200 // the images do not load in tests
    target.height = 90
    target.y = scene.height - 45
  }
  enemy.enter({ x: truck.x, y: 100, fromBehind: false })
  while (enemy.alive) enemy.takeHit(15)
  for (let i = 0; i < 30 * 5 && enemy.visible; i++) enemy.update(1 / 30)
  assert.equal(enemy.visible, false, 'it has crashed')
  assert.equal(truck.dead, true, 'the truck under it burns')
  assert.equal(train.alive, true, 'far away')
})

test('the observer fires back at a fighter behind the plane, not at one ahead, only while the fire key is held', t => {
  const scene = createScene(t)
  const { player } = scene
  const [behind, ahead] = scene.raiders
  behind.width = ahead.width = 200 // the image does not load in tests
  behind.height = ahead.height = 60
  ahead.enter({ x: player.x + 300, y: player.y, fromBehind: false })
  assert.equal(player.rearTarget, undefined)
  behind.enter({ x: player.x - rearGun.range / 2, y: player.y - 50, fromBehind: true })
  assert.equal(player.rearTarget, behind)
  player.update(1 / 30)
  assert.equal(player.rearBullets.projectiles.length, 0, 'not on his own')
  player.ammo = 0
  key('keydown', 'Space')
  player.handleInput(1 / 30)
  key('keyup', 'Space')
  assert.equal(player.rearBullets.projectiles.length, 1, 'only while the fire key is held, also with the front gun empty')
  const [round] = player.rearBullets.projectiles
  assert.ok(round.dx < player.dx, 'the round flies back')
})

test('the second mission starts standing on a runway, takes off with up, and has no fighters', t => {
  const scene = createScene(t, { mission: 1 })
  const { player } = scene
  for (const airfield of scene.airfields) airfield.width = 780 // the images do not load in tests
  player.height = 40
  player.onload()
  assert.equal(scene.raiders.length, 0)
  assert.equal(player.isGrounded, true)
  assert.ok(scene.airfieldAt(player.x), 'on a runway')
  play(scene, 1)
  assert.equal(player.alive, true, 'standing on the runway is no crash')
  assert.equal(scene.ui.outro, '', 'nor a win')
  for (let i = 0; i < 30; i++) {
    player.moveUp(1 / 30) // up held for a second
    play(scene, 1 / 30)
  }
  assert.equal(player.isGrounded, false, 'it has taken off')
})

test('landing at the end of the first mission goes on to the second, and only the last mission wins the game', t => {
  const started = []
  const scene = createScene(t, { mission: 0, manager: { start: path => started.push(path) } })
  const { player, aerodrom } = scene
  aerodrom.width = 400
  player.width = 100
  player.height = 40
  player.setPosition(aerodrom.runway.left + 100, scene.height - player.height / 2 - 1)
  scene.cameraX = player.x - 200
  player.airspeed = 250
  player.dy = 50
  play(scene, 3)
  assert.match(scene.ui.message, /You joined the partisans/)
  assert.equal(scene.ui.outro, '', 'no end screen between missions')
  play(scene, 2)
  assert.deepEqual(started, ['franjo-kluz'])
  const scenes = [new FranjoKluzScene({}), new FranjoKluzScene({})]
  t.after(() => scenes.forEach(started => started.end()))
  scenes.forEach(started => {
    started.init()
    started.clear = () => {} // happy-dom has no 2D canvas to draw the sky on
  })
  assert.equal(scenes[0].missionIndex, 1, 'the next scene flies the second mission')
  assert.equal(scenes[1].missionIndex, 0, 'a new game starts with the first')
})

test('in NDH markings the plane fools the enemy until half way, then all of it opens fire; the second mission is on alert at once', t => {
  const scene = createScene(t)
  const { player, aerodrom } = scene
  const gun = scene.enemies.find(enemy => enemy instanceof Flak)
  const soldier = scene.enemies.find(enemy => enemy instanceof Rifleman)
  const shooters = [gun, soldier]
  for (const shooter of shooters) {
    shooter.width = 60 // the images do not load in tests
    shooter.height = 80
    shooter.y = scene.height - 30
  }
  const fires = () => {
    for (const shooter of shooters) shooter.cooldown.start(0)
    player.setPosition(gun.x, gun.y - 300)
    scene.update(1 / 30, 0) // the gunners aim
    gun.trainBarrel(10) // and the barrel turns onto the plane
    scene.update(1 / 30, 0)
    player.setPosition(soldier.x, soldier.y - 300)
    // the gunners decide after the soldiers have acted, so a decision shows a frame later
    scene.update(1 / 30, 0)
    scene.update(1 / 30, 0)
    return [gun.shell.visible, soldier.bullets.projectiles.some(round => round.visible)]
  }
  const [siren] = scene.siren.sounds
  let wails = 0
  siren.play = () => wails++
  player.x = 0
  assert.deepEqual(shooters.map(shooter => scene.alerted.has(shooter)), [false, false], 'fooled')
  assert.deepEqual(fires(), [false, false], 'fooled, they do not fire')
  assert.equal(scene.alarm.raised, false)
  player.x = aerodrom.x / 2
  scene.soundAlarm()
  scene.raiseAlarm()
  assert.equal(wails, 1, 'the siren wails once, when the alarm is raised')
  assert.deepEqual(shooters.map(shooter => scene.alerted.has(shooter)), [true, true], 'on alert')
  assert.deepEqual(fires(), [true, true], 'on alert, they fire')

  const second = createScene(t, { mission: 1 })
  assert.equal(second.alarm.raised, true)
  assert.ok(second.armed.every(enemy => second.alerted.has(enemy)))
})

test('before the siren an attack alerts only the enemies in view, and those who come into view join a fight but not a calm', t => {
  const scene = createScene(t)
  for (const enemy of scene.enemies) {
    enemy.x = -50_000 // out of the way
    enemy.width = 60 // the images do not load in tests
    enemy.height = 80
  }
  const [near, beside, ahead, later] = scene.enemies.filter(enemy => enemy instanceof Rifleman)
  scene.cameraX = 900
  near.x = 1000
  beside.x = 1200
  ahead.x = later.x = 1000 + scene.width * 3

  scene.alertInView()
  assert.equal(scene.alerted.has(near), false, 'all is calm: they see their own plane')
  scene.player.shoot()
  assert.deepEqual([near, beside, ahead].map(enemy => scene.alerted.has(enemy)), [true, true, false], 'the attack is seen only in view')
  assert.equal(scene.alarm.raised, false, 'no siren')

  ahead.x = 1300
  scene.alertInView()
  assert.equal(scene.alerted.has(ahead), true, 'he comes into a fight')

  for (const enemy of [near, beside, ahead]) enemy.die()
  later.x = 1300
  scene.alertInView()
  assert.equal(scene.alerted.has(later), false, 'he comes into a calm')
})

test('every soldier keeps watch as a sentry, and no other enemy does', t => {
  const scene = createScene(t)
  const watched = scene.sentries.map(sentry => sentry.body)
  assert.deepEqual(watched, scene.enemies.filter(enemy => enemy instanceof Rifleman))
})

test('the plane flies the first mission in NDH markings and the second in partisan ones', t => {
  assert.match(createScene(t).player.image.src, /potez-25-ndh-[^/]*\.png$/)
  assert.match(createScene(t, { mission: 1 }).player.image.src, /potez-25-partisan-[^/]*\.png$/)
})

/** The air raid, the last mission, with the sizes the images would give and the plane standing on the runway. */
function airRaid(t) {
  const scene = createScene(t, { mission: missions.length - 1 })
  const { player } = scene
  for (const airfield of scene.airfields) airfield.width = 780
  player.width = 100
  player.height = 40
  player.onload()
  return scene
}

test('the air raid starts standing on the runway under the siren, with the alarm raised', t => {
  const scene = airRaid(t)
  assert.equal(scene.mission.airRaid, true)
  assert.equal(scene.player.isGrounded, true)
  assert.ok(scene.airfieldAt(scene.player.x), 'on a runway')
  assert.equal(scene.alarm.raised, true)
  assert.ok(scene.armed.every(enemy => scene.alerted.has(enemy)))
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
  assert.ok(seconds > 3 && seconds < 9, `after ${seconds.toFixed(1)} s`)
  play(scene, 3)
  assert.match(scene.ui.outro, /The bombs caught you on the ground/)
})

test('a bomb burst destroys the plane on the ground, not in the air or far from it', t => {
  const scene = airRaid(t)
  const { player } = scene
  scene.bombGround({ x: player.x + 1000, y: scene.height })
  assert.equal(player.alive, true, 'far from it')
  player.y -= 100
  scene.bombGround({ x: player.x, y: scene.height })
  assert.equal(player.alive, true, 'in the air')
  player.onload()
  scene.bombGround({ x: player.x + 100, y: scene.height })
  assert.equal(player.dead, true, 'on the ground')
})

test('a shot down raider wreck damages the plane once, a live raider destroys it', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  const [raider] = scene.raiders
  const { player } = scene
  raider.x = player.x
  raider.y = player.y
  assert.ok(player.collidesWith(raider), 'they overlap')
  raider.die()
  player.checkCollisions()
  player.checkCollisions()
  assert.equal(player.alive, true)
  assert.equal(player.health, plane.health - plane.wreckDamage, 'hit once')

  const live = airRaid(t)
  play(live, 1 / 30)
  const [next] = live.raiders
  Object.assign(next, { x: live.player.x, y: live.player.y })
  live.player.checkCollisions()
  assert.equal(live.player.dead, true)
})

test('in the air raid a raider not shot down comes back from the other side; in the first mission it does not', t => {
  const scene = airRaid(t)
  play(scene, 1 / 30)
  const [raider] = scene.raiders
  assert.equal(raider.visible, true, 'the first raider has come')
  assert.equal(raider.fromBehind, false)
  scene.cameraX = raider.x + 5000 // it has flown far past the view
  play(scene, 1 / 15)
  assert.equal(raider.visible, true, 'it is back')
  assert.equal(raider.fromBehind, true, 'from behind')
  assert.ok(raider.x < scene.cameraX, 'on the left')
  raider.die()
  scene.cameraX += 10_000
  play(scene, 10)
  assert.equal(raider.visible, false, 'shot down, it does not come back')

  const first = createScene(t)
  first.raidersSent = 0
  first.cameraX = first.mission.raids[0].x - first.width
  play(first, 1 / 30)
  const [fighter] = first.raiders
  assert.equal(fighter.visible, true)
  first.cameraX = fighter.x + 5000
  play(first, 1)
  assert.equal(fighter.visible, false, 'gone for good')
})

test('in the air raid landing wins only once no raider is left', t => {
  const scene = airRaid(t)
  const { player, aerodrom } = scene
  const kept = scene.raiders[scene.mission.raids.findIndex(raid => raid.kind === 'fighter')]
  for (const raider of scene.raiders) if (raider !== kept) raider.die()
  scene.alerted.delete(kept) // it does not fire on the landing plane
  player.setPosition(aerodrom.runway.left + 100, scene.height - player.height / 2 - 1)
  scene.cameraX = player.x - 200
  player.airspeed = 250
  player.dy = 50
  play(scene, 3)
  assert.equal(player.alive, true)
  assert.ok(player.airspeed < 20, 'it has stopped on the runway')
  assert.equal(scene.ui.outro, '', 'one raider is left')
  assert.equal(kept.visible, true, 'and it keeps coming')
  kept.die()
  play(scene, 1)
  assert.match(scene.ui.outro, /Mission successfully completed/)
})

test('the far clouds are drawn behind the groves and the plane, so they never hide it', t => {
  const scene = createScene(t)
  const [groves, clouds] = scene.scenery
  // the renderer draws the farther, higher z first
  assert.ok(clouds.depth < groves.depth, 'the clouds are the farthest layer')
  assert.ok(clouds.position.z > groves.position.z)
  assert.ok(clouds.position.z > scene.player.position.z)
})
