import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CampCompanion from '/scenes/crveni-krst/EscapingPrisoners.js'
import CampNavigation from '/scenes/crveni-krst/CampNavigation.js'
import { CampGuard, Prisoner, alarm, raiseAlarm } from '/scenes/crveni-krst/stealth.js'
import { description as flameThrower } from '/core3d/actor/derived/ww2/GermanFlameThrower.js'

function setup({ enemyX = 15, coverPoints = [], sees = () => true, postureDuration = 0 } = {}) {
  const body = new Character({ reach: 1.65, actions: { attack: .9 }, damage: [40, 40] })
  const leader = new Character({ x: -8 })
  const enemy = new Character({ x: enemyX, reach: 25, health: 100 })
  enemy.face(body)
  body.targets = [enemy]
  const controller = new CampCompanion(body, { leader, enemies: [enemy], index: 0, coverPoints, sees,
    navigation: new CampNavigation(() => false), postureDuration })
  return { body, leader, enemy, controller }
}

test('companions attack a visible guard at pipe range and the actual blow hurts him', () => {
  const { body, enemy, controller } = setup({ enemyX: 1.2 })
  controller.update(.1)
  assert.equal(controller.state, 'defend')
  assert.equal(body.moving, false)
  assert.equal(body.swing.kind, 'attack')
  body.update(.5)
  assert.equal(enemy.health.current, 60)
})

test('a wall prevents a companion attacking a nearby guard', () => {
  const { body, controller } = setup({ enemyX: 1.2, sees: () => false })
  controller.update(.1)
  assert.equal(controller.state, 'follow')
  assert.equal(body.swing, null)
})

test('companions charge nearby riflemen and flamethrowers despite incoming fire, then strike within pipe range', () => {
  for (const flame of [false, true]) {
    const { body, enemy, controller } = setup({ enemyX: 3.5 })
    if (flame) Object.assign(enemy, flameThrower.body)
    enemy.attack()
    controller.update(.1)
    assert.equal(controller.state, 'defend')
    assert.equal(body.running, true)
    assert.equal(body.crouched, false)
    assert.equal(body.swing, null, 'he closes the distance before swinging')
    const start = body.x
    for (let i = 0; i < 60 && enemy.health.current === 100; i++) {
      controller.update(.05)
      body.update(.05)
    }
    assert.ok(body.x > start + 1, 'he advances toward the guard instead of the leader behind him')
    assert.ok(enemy.health.current < 100, 'the pipe actually hits after the charge')
  }
})

test('a nearby guard takes priority over distant gunfire and releases the reserved cover', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.attack()
  controller.update(.1)
  assert.equal(controller.cover, cover)
  const close = new Character({ x: 3 })
  controller.enemies.push(close)
  body.targets.push(close)
  controller.update(.1)
  assert.equal(controller.state, 'defend')
  assert.equal(controller.cover, null)
  assert.equal(cover.owner, null)
  assert.equal(body.running, true)
  close.x = 4.5
  controller.update(.1)
  assert.equal(controller.state, 'defend', 'a small retreat does not make him abandon the charge')
  close.takeHit(1000)
  controller.update(.1)
  assert.equal(controller.state, 'cover', 'distant fire still calls for cover once the close guard is dead')
  assert.equal(controller.cover, cover)
})

test('a companion flees to opaque cover and waits out continued gunfire before following again', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.state, 'cover')
  assert.equal(controller.cover, cover)
  assert.equal(body.running, true)
  assert.equal(body.swing, null)
  body.x = cover.x
  body.z = cover.z
  for (let i = 0; i < 7; i++) {
    enemy.shotsFired++
    controller.update(1)
    assert.equal(controller.state, 'cover')
    assert.equal(body.moving, false)
  }
  controller.update(4.1)
  assert.equal(controller.state, 'follow')
  assert.equal(cover.owner, null)
})

test('a companion seeks cover when the real seven-metre flamethrower starts attacking', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ enemyX: 5, coverPoints: [cover], sees: (from, to) => to.z < 1 })
  Object.assign(enemy, flameThrower.body)
  enemy.attack()
  assert.equal(enemy.shotsFired, 0, 'the flame attack has started before its first damage event')
  controller.update(.1)
  assert.equal(enemy.reach, 7)
  assert.equal(controller.state, 'cover')
  assert.equal(controller.cover, cover)
  assert.equal(body.swing, null)
  Object.assign(body, { x: cover.x, z: cover.z })
  for (let i = 0; i < 6; i++) {
    enemy.update(.5)
    enemy.attack()
    controller.update(.5)
    assert.equal(controller.state, 'cover', 'continued flame keeps him sheltered even after sight is blocked')
  }
  enemy.update(1)
  controller.update(.1)
  controller.update(4.1)
  assert.equal(controller.state, 'follow')
  assert.equal(cover.owner, null)
})

test('a flamethrower outside its real reach does not send a companion into cover', () => {
  const { enemy, controller } = setup({ enemyX: 7.1 })
  Object.assign(enemy, flameThrower.body)
  enemy.attack()
  controller.update(.1)
  assert.equal(controller.state, 'follow')
  assert.equal(controller.cover, null)
})

test('an occluded or turned-away flamethrower does not trigger a false threat', () => {
  for (const blocked of [false, true]) {
    const { body, enemy, controller } = setup({ enemyX: 5, sees: () => !blocked })
    Object.assign(enemy, flameThrower.body)
    if (!blocked) enemy.face({ x: enemy.x + 2, z: enemy.z })
    else enemy.face(body)
    enemy.attack()
    controller.update(.1)
    assert.equal(controller.state, 'follow')
  }
})

test('a distant guard who is not shooting does not draw a companion away from the player', () => {
  const { body, leader, enemy, controller } = setup()
  controller.update(.1)
  assert.equal(controller.state, 'follow')
  assert.equal(body.swing, null)
  assert.ok(Math.abs(body.yaw) <= Math.PI * 1.5 * .1, 'the companion starts turning toward the leader gradually')
  assert.equal(body.moving, false, 'he turns before walking away')
  for (let i = 0; i < 10; i++) controller.update(.1)
  assert.ok(Math.cos(body.yaw) < 0, 'the companion finishes facing the leader, away from the gunner')
  leader.x = body.x + 1
  controller.update(.1)
  assert.equal(body.moving, false)
  assert.equal(enemy.health.current, 100)
})

test('guards can aim at a visible companion and the companion can die from their fire', () => {
  const player = new Character({ x: 15 })
  const companion = new Character({ x: 3, health: 25 })
  const guard = new Character({ reach: 25, damage: [40, 40] })
  const ai = new CampGuard(guard, { target: player, candidates: [player, companion], sees: () => true,
    litAt: () => false, random: () => .5 })
  guard.face(player)
  ai.update(.1)
  assert.equal(ai.target, companion)
  for (let frame = 0; frame < 120 && companion.alive; frame++) {
    ai.update(1 / 30)
    guard.update(1 / 30)
  }
  assert.equal(companion.dead, true)
})

test('waiting companions alternate real crouching idles without rotating or starting combat', () => {
  const { body, leader, controller } = setup()
  leader.x = 1
  const originalYaw = body.yaw
  controller.random = () => .75
  controller.update(8)
  assert.equal(body.crouched, true)
  assert.equal(body.yaw, originalYaw)
  assert.equal(body.waitPose, 'crouchRest')
  assert.equal(body.swing, null)
  assert.equal(body.moving, false)
})

test('companions finish getting up before running and lower gradually when the leader stops', () => {
  const { body, leader, controller } = setup({ postureDuration: 1 })
  controller.update(.1)
  assert.equal(body.posture.name, 'crouchUp')
  assert.equal(body.moving, false)
  assert.equal(body.crouchProgress, .9)
  controller.update(.4)
  assert.equal(body.crouchProgress, .5)
  controller.update(.5)
  assert.equal(body.posture, null)
  assert.equal(body.running, true)
  assert.equal(body.crouchProgress, 0)
  leader.x = 1
  controller.update(.1)
  assert.equal(body.posture.name, 'crouchDown')
  assert.equal(body.crouchProgress, .1)
  controller.update(.9)
  assert.equal(body.posture, null)
  assert.equal(body.crouchProgress, 1)
})

test('reversing a posture transition preserves its progress and death interrupts it', () => {
  const { body, leader, controller } = setup({ postureDuration: 1 })
  controller.update(.5)
  leader.x = 1
  controller.update(.01)
  assert.equal(body.posture.name, 'crouchDown')
  assert.ok(Math.abs(body.crouchProgress - .51) < 1e-9)
  body.takeHit(1000)
  controller.update(.1)
  assert.equal(body.posture, null)
})

test('the prisoner collision height follows the companion posture without moving his feet', () => {
  const body = new Prisoner()
  const leader = new Character({ x: -8 })
  const { size: { height }, feet } = body
  const controller = new CampCompanion(body, { leader, enemies: [], index: 0, coverPoints: [],
    sees: () => true, navigation: new CampNavigation(() => false), postureDuration: 1 })
  controller.update(.25)
  body.update(.25)
  const first = body.size.height
  controller.update(.25)
  body.update(.25)
  assert.ok(first < body.size.height && body.size.height < height)
  assert.ok(Math.abs(body.feet - feet) < 1e-9)
  controller.update(.5)
  body.update(.5)
  assert.equal(body.size.height, height)
  assert.ok(Math.abs(body.feet - feet) < 1e-9)
})

test('a crouching companion gets up before striking a nearby guard', () => {
  const { body, enemy, controller } = setup({ enemyX: 1.2, postureDuration: 1 })
  controller.update(.1)
  assert.equal(body.swing, null)
  assert.equal(body.posture.name, 'crouchUp')
  controller.update(.9)
  controller.update(.01)
  assert.equal(body.swing.kind, 'attack')
  body.update(.5)
  assert.equal(enemy.health.current, 60)
})

test('corner looking occurs in cover during a lull and ends when fire resumes', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  Object.assign(body, cover)
  controller.update(1.2)
  assert.equal(controller.state, 'cover')
  assert.equal(body.waitPose, 'crouchPeek')
  assert.equal(body.moving, false)
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(body.waitPose, 'crouchIdle')
})

test('a companion behind the leader turns at the same bounded speed at different frame rates', () => {
  const advance = dt => {
    const { body, controller } = setup()
    for (let time = 0; time < .2 - 1e-9; time += dt) {
      const before = body.yaw
      controller.update(dt)
      assert.ok(Math.abs(body.yaw - before) <= Math.PI * 1.5 * dt + 1e-9)
    }
    return body.yaw
  }
  assert.ok(Math.abs(advance(1 / 30) - advance(1 / 120)) < 1e-9)
})

test('turning across minus pi takes the short path without a full rotation', () => {
  const { body, leader, controller } = setup()
  body.yaw = Math.PI - .02
  Object.assign(leader, { x: -8, z: .16 })
  const before = body.yaw
  controller.turnToward(leader, 1 / 60)
  assert.ok(body.yaw > before)
  assert.ok(body.yaw - before < .05)
})

test('a companion turns to a nearby guard before swinging and the blow still connects', () => {
  const { body, enemy, controller } = setup({ enemyX: -1.2 })
  controller.update(1 / 60)
  assert.equal(body.swing, null, 'a guard behind him does not cause an instant turn and attack')
  for (let frame = 0; frame < 120 && !body.swing; frame++) controller.update(1 / 60)
  assert.equal(body.swing.kind, 'attack')
  body.update(.5)
  assert.equal(enemy.health.current, 60)
})

test('companions choose distinct places behind the leader and do not orbit when he only looks around', () => {
  const leader = new Prisoner({ x: 12 })
  const companions = [leader, ...[-1, 0, 1].map(z => new Prisoner({ z, speed: 1.5 }))]
  const navigation = new CampNavigation(() => false)
  const controllers = companions.slice(1).map((body, index) => new CampCompanion(body, {
    leader, index, companions, navigation, enemies: [], coverPoints: [], sees: () => true,
  }))
  for (let frame = 0; frame < 1800; frame++) {
    controllers.forEach(controller => controller.update(1 / 30))
    companions.slice(1).forEach(body => body.update(1 / 30))
    for (let i = 1; i < companions.length; i++) for (let j = i + 1; j < companions.length; j++)
      assert.ok(Math.hypot(companions[i].x - companions[j].x, companions[i].z - companions[j].z) > .65)
  }
  for (const controller of controllers) {
    const point = controller.formationPoint()
    assert.ok(Math.hypot(controller.body.x - point.x, controller.body.z - point.z) < .4)
    assert.ok(controller.body.x < leader.x)
    leader.yaw += 1
    assert.deepEqual(controller.formationPoint(), point)
  }
})

test('a companion goes around a stationary companion instead of passing through him', () => {
  const leader = new Prisoner({ x: 9 })
  const body = new Prisoner({ speed: 1.5 })
  const parked = new Prisoner({ x: 3, z: -.35 })
  const controller = new CampCompanion(body, { leader, companions: [leader, body, parked], index: 0,
    enemies: [], coverPoints: [], sees: () => true, navigation: new CampNavigation(() => false) })
  for (let frame = 0; frame < 1500; frame++) {
    controller.update(1 / 30)
    body.update(1 / 30)
    assert.ok(Math.hypot(body.x - parked.x, body.z - parked.z) > .7)
  }
  assert.ok(body.x > parked.x + 2)
  assert.deepEqual([parked.x, parked.z], [3, -.35])
})

test('a companion waits in a narrow passage and continues after the person blocking it moves', () => {
  const isBlocked = (from, direction, length) => {
    const size = Math.hypot(direction.x, direction.z)
    return Math.abs(from.z + direction.z / size * length) > .5
  }
  const leader = new Prisoner({ x: 9 })
  const body = new Prisoner({ speed: 1.5, isBlocked })
  const parked = new Prisoner({ x: 3 })
  const controller = new CampCompanion(body, { leader, companions: [leader, body, parked], index: 0,
    enemies: [], coverPoints: [], sees: () => true, navigation: new CampNavigation(isBlocked) })
  for (let frame = 0; frame < 600; frame++) {
    controller.update(1 / 30)
    body.update(1 / 30)
    assert.ok(body.x < parked.x - .7)
    assert.ok(Math.abs(body.z) <= .5)
  }
  parked.z = 2
  for (let frame = 0; frame < 900; frame++) {
    controller.update(1 / 30)
    body.update(1 / 30)
  }
  assert.ok(body.x > 6)
})

test('the group keeps its spacing and rejoins after the leader walks and changes direction', () => {
  const leader = new Prisoner({ x: 8 })
  const companions = [leader, ...[-1, 0, 1].map(z => new Prisoner({ z, speed: 1.5 }))]
  const navigation = new CampNavigation(() => false)
  const controllers = companions.slice(1).map((body, index) => new CampCompanion(body, {
    leader, index, companions, navigation, enemies: [], coverPoints: [], sees: () => true, postureDuration: 1,
  }))
  for (let frame = 0; frame < 2400; frame++) {
    if (frame === 600) leader.steer({ ahead: 1 })
    if (frame === 720) leader.yaw = -Math.PI / 2
    if (frame === 840) leader.steer()
    controllers.forEach(controller => controller.update(1 / 30))
    companions.forEach(body => body.update(1 / 30))
    for (let i = 1; i < companions.length; i++) for (let j = i + 1; j < companions.length; j++)
      assert.ok(Math.hypot(companions[i].x - companions[j].x, companions[i].z - companions[j].z) > .65)
  }
  for (const controller of controllers) {
    const point = controller.formationPoint()
    assert.ok(Math.hypot(controller.body.x - point.x, controller.body.z - point.z) < .4)
  }
})

test('a changed destination discards an old bypass instead of sending the companion backwards', () => {
  const { body, leader, controller } = setup()
  leader.x = 8
  controller.destination = { x: -10, z: 0 }
  controller.bypass = [{ x: -3, z: 1 }]
  controller.update(.1)
  assert.equal(body.moving, true)
  assert.ok(Math.cos(body.yaw) > .9)
})

test('all companions close a gap during a long player sprint and settle when he stops', () => {
  const leader = new Prisoner({ x: 12 })
  const companions = [leader, ...[-1, 0, 1].map((z, index) => new Prisoner({ z, speed: 1.5 + index * .12 }))]
  const navigation = new CampNavigation(() => false)
  const controllers = companions.slice(1).map((body, index) => new CampCompanion(body, {
    leader, index, companions, navigation, enemies: [], coverPoints: [], sees: () => true, postureDuration: 1.567,
  }))
  leader.steer({ ahead: 1, running: true })
  const atTen = []
  let fastest = 0
  for (let frame = 0; frame < 1800; frame++) {
    if (frame === 1350) leader.steer()
    controllers.forEach(controller => controller.update(1 / 30))
    companions.forEach(body => body.update(1 / 30))
    if (frame === 300) controllers.forEach(controller => atTen.push(leader.x - controller.body.x))
    if (frame === 1349) controllers.forEach((controller, index) => {
      assert.ok(leader.x - controller.body.x < atTen[index] - 2, 'each companion closes the sprint gap')
      assert.ok(leader.x - controller.body.x < controller.followDistance + 1)
      assert.equal(controller.body.running, true, 'he keeps running with the leader instead of crouching mid-sprint')
    })
    for (const { body } of controllers) {
      fastest = Math.max(fastest, Math.hypot(body.vx, body.vz))
      assert.ok(Math.hypot(body.vx, body.vz) <= 4.6 + 1e-9)
    }
    for (let i = 1; i < companions.length; i++) for (let j = i + 1; j < companions.length; j++)
      assert.ok(Math.hypot(companions[i].x - companions[j].x, companions[i].z - companions[j].z) > .65)
  }
  assert.ok(fastest > 4.1)
  assert.equal(leader.speed, 2)
  assert.equal(leader.run, 2)
  for (const controller of controllers) {
    const point = controller.formationPoint()
    assert.ok(Math.hypot(controller.body.x - point.x, controller.body.z - point.z) < .4)
    assert.equal(controller.body.moving, false)
    assert.equal(controller.body.crouched, true)
    assert.equal(controller.body.run, controller.baseRun)
  }
})

test('catch-up pace is cleared when a companion stops following to defend himself', () => {
  const { body, enemy, controller } = setup()
  const normalRun = body.run
  controller.update(.1)
  assert.ok(body.run > normalRun)
  enemy.x = 1.2
  controller.update(.1)
  assert.equal(controller.state, 'defend')
  assert.equal(body.run, normalRun)
})

test('a cover counts by his crouching height, even while he still stands', () => {
  // a wall up to 1.2 m between him and the guard
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 || to.y > 1.2 })
  body.size.height = 1.8
  body.crouched = false
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.cover, cover)
})

test('a companion prefers the cover he can reach out of the line of fire to a nearer one across it', () => {
  // everything beyond z 1.5 is out of the guard's sight
  const near = { x: 1, z: 2 }, sheltered = { x: -2, z: 3.4 }
  const { enemy, controller } = setup({ coverPoints: [near, sheltered], sees: (from, to) => to.z <= 1.5 })
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.cover, sheltered)
  assert.equal(sheltered.owner, controller.body)
  assert.equal(near.owner, undefined)
})

test('with no cover a companion gets out of sight nearby instead of running back to an exposed leader', () => {
  const { body, enemy, controller } = setup({ sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.state, 'cover')
  assert.ok(controller.retreat.z >= 1, 'the place he heads for is out of sight')
  for (let i = 0; i < 40; i++) {
    controller.update(.05)
    body.update(.05)
  }
  assert.ok(body.z > .5 && body.x > -4, 'he moved out of sight nearby, not back to the leader at x -8')
})

test('with nowhere out of sight a companion stays down where he is', () => {
  const { body, enemy, controller } = setup()
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.state, 'cover')
  assert.equal(controller.retreat, null)
  assert.equal(body.moving, false)
  assert.equal(body.crouched, true)
})

test('a companion who dies frees the cover he reserved', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(cover.owner, body)
  body.takeHit(1000)
  controller.update(.1)
  assert.equal(cover.owner, null)
})

test('a guard\'s shout sends the guards in hearing to search where it came from, not those far off', () => {
  const navigation = new CampNavigation(() => false)
  const prisoner = new Prisoner({ x: 0 })
  const guard = x => new CampGuard(new Character({ x }), { target: prisoner, candidates: [prisoner], sees: () => false,
    navigation })
  const caller = guard(5), near = guard(5 + alarm.hearing - 1), far = guard(5 + alarm.hearing + 1)
  raiseAlarm([caller, near, far], caller)
  assert.equal(near.doing, 'search')
  assert.deepEqual([near.lastSeen.x, near.lastSeen.z], [5, 0])
  assert.notEqual(far.doing, 'search')
  near.update(.1)
  assert.ok(near.body.running, 'he hurries to the shout')
})

test('getting up a companion takes the recorded step forward, but not through a wall', () => {
  for (const wall of [false, true]) {
    const { body, controller } = setup({ postureDuration: 1 })
    controller.navigation = new CampNavigation(() => wall)
    controller.postureShift = (name, time) => name === 'crouchUp' ? time * .4 : 0
    controller.crouched = true
    controller.decide = () => {
      body.crouched = false
    }
    for (let i = 0; i < 10; i++) controller.update(.1)
    assert.ok(Math.abs(body.x - (wall ? 0 : .4)) < 1e-9, wall ? 'a wall stops the step' : 'he steps 0.4 m ahead')
  }
})
