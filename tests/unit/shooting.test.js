import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'
import { bomb } from '/core/gameplay/bodies/projectiles/Bomb.js'
import { earthGravity } from '/core/gameplay/gravity.js'

/**
 * Each game's shots as the player sees them, in the real scene: a shot flying in the view is drawn all the way, and a
 * shot aimed at a target hits it, also late in a level, where the camera has moved far along the world.
 */

let canvas2d

before(async() => {
  createPageElements()
  // a canvas that draws nothing, so whole scenes run without a browser; the 2D canvas keeps it from its first import
  const fill = { addColorStop() {}, setTransform() {} }
  const ctx = new Proxy({}, { get: (target, name) => String(name).startsWith('create') ? () => fill : () => {} })
  HTMLCanvasElement.prototype.getContext = () => ctx
  ;({ default: canvas2d } = await import('/core/io/canvas2d.js'))
})

/** Whether the middle of `view` is on the screen of `scene`'s camera. */
const onScreen = (view, { cameraX = 0, cameraY = 0 }) => {
  const x = view.x - cameraX, y = view.y - cameraY
  return x >= 0 && x <= canvas2d.width && y >= 0 && y <= canvas2d.height
}

/**
 * Plays `scene` for up to `seconds` until `done()`, checking each frame that every view of `shots()` in flight on the
 * screen is drawn; returns whether it was done. Pictures load between frames, as in a browser.
 */
async function watch(scene, { seconds, shots, done, step = 1 / 30 }) {
  for (let i = 0; i < seconds / step; i++) {
    scene.session.update(step)
    scene.handleInput(step)
    scene.update(step, i * step)
    await null
    for (const view of shots()) if (view.visible && onScreen(view, scene))
      assert.equal(view.shown, true, `a shot at ${Math.round(view.x - (scene.cameraX ?? 0))} px on the screen is drawn`)
    if (done()) return true
  }
  return false
}

const play = (scene, seconds, step = 1 / 30) => watch(scene, { seconds, step, shots: () => [], done: () => false })

async function trieste(t) {
  loadImages(t, { '/items/granata.gif': [32, 8], '/plamen.gif': [75, 98] })
  const { default: Scene } = await import('/scenes/to-trieste/Main.js')
  const { default: Health } = await import('/core/gameplay/Health.js')
  const scene = new Scene()
  t.after(() => scene.end())
  await scene.init()
  t.mock.method(scene.ui, 'showMessage', () => {})
  scene.player.health = new Health({ maximum: 1_000_000 })
  scene.session.ready()
  scene.session.start()
  // far along the road, where a shell judged by the canvas instead of the camera vanished at the barrel
  await play(scene, 20)
  return scene
}

/** Leaves the tank alone on the road: no enemies, and no air raid to come. */
function alone(scene) {
  for (const hostile of [...scene.hostiles]) scene.despawn(hostile)
  scene.raid.at = Infinity
}

test('Do Trsta: far along the road, a shell of the tank flies in view all the way to a bunker it reaches level', async t => {
  const scene = await trieste(t)
  const { player } = scene
  alone(scene)
  // 26.4 m ahead of the muzzle, which a level shell without the speed of the marching tank falls short of
  const target = scene.spawn(scene.bunker('pillbox', player.muzzle.x + 26.4 + 3.08)).body
  target.canFire = () => false
  player.elevation = 0
  player.reload.start(0)
  assert.equal(player.shoot(), true)
  const hit = await watch(scene, { seconds: 3, shots: () => scene.playerView.projectileViews.values(), done: () => target.hitsTaken > 0 })
  assert.ok(hit, 'the shell reaches the bunker')
})

test('Do Trsta: the first shot of an enemy gun, tank or dive bomber, and the first pass of a fighter, hit the marching tank', async t => {
  for (const kind of ['antiTankGun', 'germanTank', 'diveBomber', 'fighter']) {
    const scene = await trieste(t)
    const { player } = scene
    alone(scene)
    const hitsBefore = player.hitsTaken
    const plane = ['diveBomber', 'fighter'].includes(kind)
    const { body, view } = scene.spawn(plane ? scene.plane(kind) : scene.groundEnemy(kind, player.x + 44))
    const shots = () => ({ diveBomber: [body.bomb], fighter: body.bullets?.projectiles })[kind] ?? body.shells.projectiles
    // a fighter fires while its nose is on the tank, until it has passed over it
    const over = () => kind === 'fighter' ? body.x < player.x : body.shotsFired > 0
    const landed = await watch(scene, { seconds: 15, shots: () => view.projectileViews?.values() ?? [],
      done: () => over() && body.shotsFired > 0 && shots().every(shot => !shot.active) })
    assert.ok(landed, `${kind} fires`)
    assert.ok(player.hitsTaken > hitsBefore, `the first shots of ${kind} hit`)
    scene.end()
  }
})

async function kluz(t) {
  loadImages(t)
  const { default: Scene, continueWithMission } = await import('/scenes/franjo-kluz/Main.js')
  continueWithMission(0)
  const scene = new Scene({})
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  // far along the valley, the plane flying on its own above the ruins it could crash into
  scene.player.y = 40
  await play(scene, 12)
  return scene
}

test('Franjo Kluz: far along the valley, the front gun fires in view at a fighter ahead and hits it', async t => {
  const scene = await kluz(t)
  const { player } = scene
  const raider = scene.raiders.find(({ body }) => body.constructor.name === 'Fighter')
  scene.enterRaider(raider, { fromBehind: false })
  // it flies straight at the plane, at its height, instead of turning away
  scene.controllers.splice(0, scene.controllers.length, ...scene.controllers.filter(({ body }) => body !== raider.body))
  Object.assign(raider.body, { x: player.x + 30, y: player.y, vy: 0 })
  const hit = await watch(scene, { seconds: 3, shots: () => scene.playerView.projectileViews?.values() ?? [],
    done: () => {
      player.shoot()
      return raider.body.hitsTaken > 0
    } })
  assert.ok(hit, 'the fighter is hit')
})

test('Franjo Kluz: far along the valley, the observer fires back in view at a fighter chasing the plane and hits it', async t => {
  const scene = await kluz(t)
  const { player } = scene
  const raider = scene.raiders.find(({ body }) => body.constructor.name === 'Fighter')
  scene.enterRaider(raider, { fromBehind: true })
  Object.assign(raider.body, { x: player.x - 20, y: player.y })
  const gun = scene.playerView.rearGunPart, fighter = raider.view
  const hit = await watch(scene, { seconds: 4, shots: () => scene.playerView.projectileViews?.values() ?? [],
    done: () => {
      // the drawn gun, whose picture points back, points at the fighter it fires at
      if (player.rearTarget) {
        const off = Math.atan2(fighter.y - gun.y, fighter.x - gun.x) - (gun.angle + Math.PI)
        assert.ok(Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) < .1, `the gun points ${off.toFixed(2)} rad off the fighter`)
      }
      return raider.body.hitsTaken > 0
    } })
  assert.ok(player.rearBullets.projectiles.length > 0, 'the observer fires')
  assert.ok(hit, 'the fighter behind is hit')
})

test('Franjo Kluz: far along the valley, a bomb falls in view onto the enemy under it', async t => {
  const scene = await kluz(t)
  const { player } = scene
  const { body: target } = scene.enemies.find(({ body }) => body.alive && body.constructor.name === 'Vehicle')
  // where the bomb, falling with the plane's speed, comes down
  target.x = player.x + player.vx * Math.sqrt(2 * player.y / (earthGravity * bomb.fall))
  assert.equal(player.dropBomb(), true)
  const bombs = scene.playerView.children.filter(view => view.constructor.name === 'BombSprite')
  const hit = await watch(scene, { seconds: 4, shots: () => bombs, done: () => target.dead })
  assert.ok(hit, 'the bomb destroys it')
})

test('Franjo Kluz: once the alarm is raised, the flak hits the plane flying at it', async t => {
  const scene = await kluz(t)
  const { player } = scene
  const { default: Health } = await import('/core/gameplay/Health.js')
  player.health = new Health({ maximum: 1_000_000 })
  scene.soundAlarm()
  const { body: flak, view } = scene.enemies.find(({ body }) => body.constructor.name === 'Flak')
  flak.x = player.x + 40
  const hitsBefore = player.hitsTaken
  const hit = await watch(scene, { seconds: 8, shots: () => view.children ?? [], done: () => player.hitsTaken > hitsBefore })
  assert.ok(hit, 'the flak hits the plane')
})

async function camac(t) {
  loadImages(t)
  const { default: Scene } = await import('/scenes/camac/Main.js')
  // the landing on Šolta, whose banks are guarded
  const scene = new Scene({ stage: 1 })
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const { default: Health } = await import('/core/gameplay/Health.js')
  scene.player.health = new Health({ maximum: 1_000_000 })
  // down the river at full throttle, until the S-boat comes
  for (let i = 0; i < 30 * 30 && !scene.encounter.boat; i++) {
    scene.player.throttle(1 / 30)
    await play(scene, 1 / 30)
  }
  return scene
}

test('Čamac: down the river, the boat\'s gun fires in view at the S-boat ahead and hits it', async t => {
  const scene = await camac(t)
  const { player } = scene
  assert.ok(scene.encounter.boat, 'the S-boat has come')
  const { body: target } = scene.encounter.boat
  const ahead = player.heading
  Object.assign(target, { x: player.x + ahead.x * 25, z: player.z + ahead.z * 25 })
  const hit = await watch(scene, { seconds: 3, shots: () => scene.playerView.projectileViews?.values() ?? [],
    done: () => {
      player.shoot()
      return target.hitsTaken > 0
    } })
  assert.ok(hit, 'the S-boat is hit')
})

test('Čamac: down the river, the S-boat and the shore guns hit the boat', async t => {
  const scene = await camac(t)
  const { player } = scene
  const hitsBefore = player.hitsTaken
  const views = () => [scene.encounter.boat?.view, ...scene.shoreDefenses.positions.map(({ view }) => view)]
    .flatMap(view => [...view?.projectileViews?.values() ?? []])
  const hit = await watch(scene, { seconds: 10, shots: views, done: () => player.hitsTaken > hitsBefore })
  assert.ok(hit, 'the boat is hit')
})

/** The views of the shots of `views`. */
const shotViews = (...views) => () => views.flatMap(view => [...view?.projectileViews?.values() ?? []])

async function vis(t) {
  loadImages(t)
  const { default: Scene } = await import('/scenes/vis/Main.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  scene.waves.schedule = [{ at: 0, path: 'straight', x: .5 }]
  await play(scene, 1)
  return scene
}

test('Vis: the plane fires in view at an enemy ahead and hits it', async t => {
  const scene = await vis(t)
  const { player } = scene
  const [{ body: target }] = scene.waves.enemies
  scene.controllers.splice(0, scene.controllers.length, ...scene.controllers.filter(({ body }) => body !== target))
  Object.assign(target, { x: player.x, z: player.z - 20, vx: 0, vz: 0 })
  const hit = await watch(scene, { seconds: 2, shots: shotViews(scene.playerView), done: () => {
    player.shoot()
    return target.hitsTaken > 0
  } })
  assert.ok(hit, 'the enemy is hit')
})

test('Vis: an enemy on the screen hits the plane', async t => {
  const scene = await vis(t)
  const { player } = scene
  player.shield = 0
  const [{ body, view }] = scene.waves.enemies
  const hit = await watch(scene, { seconds: 6, shots: shotViews(view), done: () => {
    player.shield = 0
    return player.hitsTaken > 0
  } })
  assert.ok(hit, `the plane is hit after ${body.shotsFired} shots`)
})

test('Ustanak: the guns range in on each other until a shot hits', async t => {
  loadImages(t)
  const { default: Scene } = await import('/scenes/ustanak/Main.js')
  const { default: CannonAI } = await import('/core/gameplay/controllers/CannonAI.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const [left, right] = scene.guns
  // the computer plays the left gun too
  const ai = new CannonAI({ cannon: left, target: right, clock: scene.session.clock })
  const hit = await watch(scene, { seconds: 120, shots: shotViews(...scene.gunViews), done: () => {
    if (scene.canShoot(0)) ai.update()
    return scene.guns.some(gun => gun.hitsTaken > 0)
  } })
  assert.ok(hit, 'a gun is hit')
})

test('Bunker: the machine gunner hits the grenadier in his reach', async t => {
  loadImages(t)
  const { default: Scene } = await import('/scenes/bunker/Main.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const { player, mitraljezac: gunner } = scene
  Object.assign(player, { x: gunner.x - 15, z: gunner.z })
  const hit = await watch(scene, { seconds: 6, shots: shotViews(scene.gunnerView), done: () => player.hitsTaken > 0 || player.dead })
  assert.ok(hit, 'the grenadier is hit')
})

test('Bunker: the attack key throws a grenade in front of the grenadier, which destroys the bunker it bursts by', async t => {
  loadImages(t)
  const { default: Scene } = await import('/scenes/bunker/Main.js')
  const { grenadier } = await import('/core/gameplay/bodies/soldiers/Grenadier.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const { player, bunker, mitraljezac: gunner, projection } = scene
  // nothing else in the way: no mines, and the gunner holds fire
  scene.mine.length = 0
  gunner.canFire = () => false
  await play(scene, .1)
  // left of the bunker, facing it, a throw away
  Object.assign(player, projection.toWorld({ x: bunker.x - projection.length(grenadier.throw.ahead), y: bunker.y - 36 }),
    { vx: 0, vz: 0, facing: 1 })
  // the attack key held, as the page without a mouse has no keyboard input
  scene.controllers.find(controller => controller.input).input = { attack: true }
  const destroyed = await watch(scene, { seconds: 3, shots: () => [], done: () => bunker.dead })
  assert.ok(player.grenade.bursts > 0, 'the grenade burst')
  assert.ok(destroyed, 'the bunker is destroyed')
  assert.match(scene.ui.outro, /bunker has been destroyed/)
})

test('Bunker: a grenade destroys a mine its burst reaches, which then no longer goes off under the grenadier', async t => {
  loadImages(t)
  const { default: Scene } = await import('/scenes/bunker/Main.js')
  const { grenadier } = await import('/core/gameplay/bodies/soldiers/Grenadier.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const { player, mitraljezac: gunner, projection } = scene
  gunner.canFire = () => false
  const [mina] = scene.mine.splice(0)
  scene.mine.push(mina)
  await play(scene, .1)
  Object.assign(player, { vx: 0, vz: 0, facing: 1 })
  // the mine lies where the grenade will land
  const landing = projection.point({ x: player.x + grenadier.throw.ahead, z: player.z + grenadier.throw.feet })
  Object.assign(mina, landing)
  player.shoot()
  await watch(scene, { seconds: 2, shots: () => [], done: () => player.grenade.bursts > 0 })
  assert.equal(mina.alive, false, 'the mine is destroyed')
  Object.assign(player, projection.toWorld({ x: mina.x, y: mina.y }))
  await play(scene, .2)
  assert.equal(player.alive, true, 'and does not go off')
})

test('Tenkići: the tank driving itself hits the player\'s tank standing in its reach', async t => {
  loadImages(t)
  const { default: Scene } = await import('/scenes/tenkici/Main.js')
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  const { tenk, tenk2 } = scene
  tenk.x = tenk2.x - 40
  const hit = await watch(scene, { seconds: 20, shots: shotViews(scene.tenk2View), done: () => tenk.hitsTaken > 0 })
  assert.ok(hit, 'the player\'s tank is hit')
})

test('Do Trsta: a bunker round that hits nothing flies across a wide screen and leaves play only past its edge', async t => {
  // as wide as a large monitor, which a round that fell out of play after a second never crossed
  const { width } = canvas2d
  canvas2d.width = 1920
  t.after(() => {
    canvas2d.width = width
  })
  const scene = await trieste(t)
  alone(scene)
  const right = (scene.cameraX + canvas2d.width * .9) / scene.projection.pxPerMeter
  const { body, view } = scene.spawn(scene.bunker('pillbox', right))
  body.targets = []
  let round = null, lastX = null
  await watch(scene, { seconds: 8, shots: () => view.projectileViews?.values() ?? [], done: () => {
    round ??= body.bullets.projectiles.find(bullet => bullet.active) ?? null
    if (round?.active) lastX = scene.projection.point(round).x - scene.cameraX
    return round && !round.active
  } })
  assert.ok(round, 'the bunker fires')
  assert.ok(lastX < 0, `it left play ${Math.round(lastX)} px from the left edge of the screen`)
})
