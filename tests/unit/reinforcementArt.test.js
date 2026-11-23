import { before, test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {},
  beginPath() {}, arc() {}, fill() {} }
let Body, BodySprite, World, sideProjection, bodyImage, actorArt, damageBySource, Partisan, SeaMine
let Rifleman, RiflemanSprite, spriteArt, GameClock
let ActorAtlas, GunCarrier, gunCarrierKinds

const loaded = (view, width, height) => {
  loadAtlas(view, width, height)
  Object.defineProperty(view.image, 'complete', { value: true, configurable: true })
}

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => ctx)
  ;({ default: Body } = await import('/core/gameplay/bodies/Body.js'))
  ;({ default: BodySprite } = await import('/core/actor/BodySprite.js'))
  ;({ default: World } = await import('/core/World.js'))
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  ;({ bodyImage } = await import('/core/actor/wreckView.js'))
  ;({ actorArt, damageBySource } = await import('/core/actor/reinforcementArt.js'))
  ;({ default: Partisan } = await import('/core/gameplay/bodies/soldiers/Partisan.js'))
  ;({ default: SeaMine } = await import('/core/gameplay/bodies/boats/SeaMine.js'))
  ;({ default: Rifleman } = await import('/core/gameplay/bodies/soldiers/Rifleman.js'))
  ;({ default: RiflemanSprite } = await import('/core/actor/soldiers/RiflemanSprite.js'))
  ;({ default: spriteArt } = await import('/core/actor/spriteArt.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
  ;({ default: ActorAtlas } = await import('/core/actor/ActorAtlas.js'))
  ;({ default: GunCarrier, gunCarrierKinds } = await import('/core/gameplay/bodies/vehicles/GunCarrier.js'))
})

test('propellers and the turret are separate live layers and disappear on the held wreck pose', t => {
  const draws = []
  t.mock.method(ctx, 'drawImage', (...args) => draws.push(args))
  for (const id of ['he111', 'storch', 'sdkfz222', 'motorcycle']) {
    const art = actorArt[id]
    const sheet = new ActorAtlas(art)
    loaded(sheet, art.width * 4, art.height * 6)
    for (const layer of sheet.layers)
      if (layer.view) loaded(layer.view, layer.frame[0] * layer.frames, layer.frame[1])
    draws.length = 0
    sheet.drawLocal(ctx, { width: 240, height: 100 }, 'idle', .2)
    assert.equal(draws.length, 2, id + ': body plus separate attachment')
    assert.equal(draws[1][0], sheet.layers[0].view?.image ?? sheet.image)
    draws.length = 0
    sheet.drawLocal(ctx, { width: 240, height: 100 }, 'dead', 100)
    assert.equal(draws.length, 1, id + ': no propeller or turret on the wreck')
    assert.equal(draws[0][2], art.clips.dead.row * art.height)
  }
})

for (const [kindId, artId] of [['armoredCar', 'sdkfz222'], ['motorcycle', 'motorcycle']])
  test(`the rotating ${kindId} barrel, muzzle and projectile direction agree in both directions`, () => {
    const kind = gunCarrierKinds[kindId]
    const art = actorArt[artId]
    const layer = art.layers[0]
    const [left, top, right, bottom] = art.bounds
    const sx = kind.size.length / (right - left), sy = kind.size.height / (bottom - top)
    const vx = (art.muzzlePoint[0] - layer.anchor[0]) * sx
    const vy = (art.muzzlePoint[1] - layer.anchor[1]) * sy
    for (const yaw of [0, Math.PI]) {
      const body = new GunCarrier({ kind, x: 20, y: 3, yaw, clock: new GameClock() })
      body.aimAt({ x: body.x + body.forward * 20, y: 8 })
      const angle = -body.gunPitch * art.facing
      const screenX = (layer.mount[0] - (left + right) / 2) * sx + vx * Math.cos(angle) - vy * Math.sin(angle)
      const screenY = (layer.mount[1] - (top + bottom) / 2) * sy + vx * Math.sin(angle) + vy * Math.cos(angle)
      assert.ok(Math.abs(body.muzzle.x - body.x - screenX * body.forward * art.facing) < 1e-9)
      assert.ok(Math.abs(body.muzzle.y - body.y + screenY) < 1e-9)
      const origin = body.muzzle, target = body.aimPoint
      const pitch = Math.atan2(target.y - origin.y, Math.abs(target.x - origin.x))
      const baseline = Math.atan2(kind.gun.barrel.above, kind.gun.barrel.ahead)
      assert.ok(Math.abs(pitch - body.gunPitch - baseline) < 1e-9)
    }
  })

test('a hit is a finite view reaction, freezes at zero time, and never overrides death or changes the collider', t => {
  const body = new Rifleman({ x: 10, clock: new GameClock() })
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  const art = Object.values(spriteArt).find(item => item.src === 'armies/game-ready/vojnici/nemacki-strelac-sprites.png')
  const view = new RiflemanSprite(body, { art, projection })
  const world = new World()
  world.add(body, view)
  t.after(() => world.end())
  loaded(view, 512, 768)
  loaded(view.hitReaction, view.hitReaction.art.width * 4, view.hitReaction.art.height)
  const collider = { ...body.size }
  const draws = []
  t.mock.method(ctx, 'drawImage', (...args) => draws.push(args))
  body.takeHit(1)
  world.update(0)
  view.render(ctx)
  assert.equal(draws.at(-1)[0], view.hitReaction.image)
  world.update(.12)
  view.render(ctx)
  const frame = draws.at(-1)[1]
  world.update(0)
  view.render(ctx)
  assert.equal(draws.at(-1)[1], frame)
  world.update(.3)
  view.render(ctx)
  assert.equal(draws.at(-1)[0], view.image)
  body.takeHit(1000)
  world.update(0)
  assert.equal(view.renderHit(ctx), false)
  assert.deepEqual(body.size, collider)
})

test('the skirmisher hit preserves the visible kneeling height and foot line in both directions', async t => {
  const Skirmisher = (await import('/core/gameplay/bodies/soldiers/Skirmisher.js')).default
  const SkirmisherSprite = (await import('/core/actor/soldiers/SkirmisherSprite.js')).default
  const draws = []
  t.mock.method(ctx, 'drawImage', (...args) => draws.push(args))
  // Measured visible source bounds after removing only alpha < 8/255.
  const source = { width: 1774, height: 887, top: 111, bottom: 366 }
  for (const yaw of [0, Math.PI]) {
    const body = new Skirmisher({ yaw })
    const view = new SkirmisherSprite(body, { projection: sideProjection({ pxPerMeter: 40, groundY: 300 }) })
    const world = new World()
    world.add(body, view)
    t.after(() => world.end())
    loaded(view, source.width, source.height)
    const hit = view.hitReaction.art
    loaded(view.hitReaction, hit.width * 4, hit.height)
    view.render(ctx)
    const idleDraw = draws.at(-1)
    const idleHeight = (source.bottom - source.top) * idleDraw[8] / (source.height / 2)
    const idleFoot = idleDraw[6] + source.bottom * idleDraw[8] / (source.height / 2)
    body.takeHit(1)
    world.update(0)
    view.render(ctx)
    const hitDraw = draws.at(-1)
    assert.equal(hitDraw[0], view.hitReaction.image)
    const hitHeight = (hit.bounds[3] - hit.bounds[1]) * hitDraw[8] / hit.height
    const hitFoot = hitDraw[6] + hit.bounds[3] * hitDraw[8] / hit.height
    // The original grid has half-pixel edges; its extracted reference rounds to 444 px.
    assert.ok(Math.abs(hitHeight - idleHeight) < .1, 'a hit must not enlarge the visible figure')
    assert.ok(Math.abs(hitFoot - idleFoot) < .1, 'a hit keeps the same foot line')
    assert.deepEqual(body.size, { length: 2.2, height: 2, width: .25 })
  }
})

test('bearers and gun crews retain visible scale and ground contact during a hit, both armies and directions', async t => {
  const { default: Bearer, bearerKinds } = await import('/core/gameplay/bodies/soldiers/FlagBearer.js')
  const BearerView = (await import('/core/actor/soldiers/FlagBearerSprite.js')).default
  const Crew = (await import('/core/gameplay/bodies/soldiers/CannonCrew.js')).default
  const CrewView = (await import('/core/actor/soldiers/CannonCrewSprite.js')).default
  const cases = [
    { italian: false, bearer: true, size: [2172, 724], rows: 1, top: 32, bottom: 682 },
    { italian: true, bearer: true, size: [1774, 887], rows: 2, top: 22, bottom: 423 },
    { italian: false, size: [1263, 1246], rows: 4, top: 15, bottom: 295 },
    { italian: true, size: [1254, 1254], rows: 4, top: 16, bottom: 303 },
  ]
  const draws = []
  const paint = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {},
    moveTo() {}, lineTo() {}, stroke() {}, drawImage: (...args) => draws.push(args) }
  for (const item of cases) for (const yaw of [0, Math.PI]) {
    const body = item.bearer ? new Bearer({ yaw, kind: bearerKinds[item.italian ? 'italian' : 'partisan'] }) : new Crew({ yaw })
    const View = item.bearer ? BearerView : CrewView
    const view = new View(body, { italian: item.italian, projection: sideProjection({ pxPerMeter: 40, groundY: 300 }), flagTime: () => 0 })
    const world = new World()
    world.add(body, view)
    t.after(() => world.end())
    loaded(view, ...item.size)
    const hit = view.hitReaction.art
    loaded(view.hitReaction, hit.width * 4, hit.height)
    view.render(paint)
    const idle = draws.at(-1), sourceHeight = item.size[1] / item.rows
    const height = (item.bottom - item.top) * idle[8] / sourceHeight
    const feet = idle[6] + item.bottom * idle[8] / sourceHeight
    body.takeHit(1)
    world.update(0)
    view.render(paint)
    const struck = draws.at(-1)
    assert.equal(struck[0], view.hitReaction.image)
    assert.ok(Math.abs((hit.bounds[3] - hit.bounds[1]) * struck[8] / hit.height - height) < .2)
    assert.ok(Math.abs(struck[6] + hit.bounds[3] * struck[8] / hit.height - feet) < .2)
  }
})

test('every registered damage picture preloads, appears only below half health, and yields to destruction', () => {
  for (const [src, id] of Object.entries(damageBySource)) {
    const body = new Body({ states: { idle: {}, dead: {} } })
    const view = new BodySprite(body, src, { projection: sideProjection({ pxPerMeter: 22, groundY: 300 }) })
    const { width, height } = actorArt[id]
    loaded(view.damageArt, width, height)
    const original = [view.width, view.height]
    body.takeHit(40)
    assert.equal(bodyImage(view), view.image, id)
    body.takeHit(20)
    assert.equal(bodyImage(view), view.damageArt.image, id)
    assert.deepEqual([view.width, view.height], original, id)
    if (view.heavyArt) {
      loaded(view.heavyArt, width, height)
      body.takeHit(20)
      assert.equal(bodyImage(view), view.heavyArt.image, id)
    }
    body.takeHit(1000)
    assert.notEqual(bodyImage(view), view.damageArt.image, id)
  }
})

test('partisan roles move, actually shoot, reject unsupported work/attack, and cannot resume after dying', () => {
  for (const role of ['runner', 'lmg', 'rear', 'loader']) {
    const body = new Partisan({ role, groundAt: () => 2 })
    assert.equal(body.y, 2.9)
    body.setState('move')
    body.update(.5)
    assert.ok(body.x > 0, role)
    body.aimAt(body.ahead(10))
    const previous = body.shotsFired
    body.setState('attack')
    body.update(.1)
    assert.equal(body.shotsFired > previous, role !== 'loader', role)
    body.takeHit(1000)
    assert.equal(body.state, 'dead', role)
    const { x } = body
    body.setState('move')
    body.update(1)
    assert.equal(body.x, x, role)
    assert.equal(body.state, 'dead', role)
  }
})

test('a mine can be shot on the continuous path and stays destroyed', () => {
  const mine = new SeaMine({ x: 5, z: 3 })
  assert.ok(mine.hitTime({ x: 0, z: 3 }, { x: 10, z: 3 }) !== null)
  mine.takeHit(20)
  assert.equal(mine.state, 'dead')
  mine.update(1)
  assert.equal(mine.alive, false)
})

test('Neretva adds rear-facing allies who fire through real scene updates', async t => {
  const { default: Scene } = await import('/scenes/neretva/Main.js')
  const scene = new Scene()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.update(.1)
  assert.equal(scene.allies.length, 3)
  for (const body of scene.allies) {
    assert.equal(body.role, 'rear')
    assert.ok(body.shotsFired > 0)
    assert.equal(body.targets.length, 0, 'supporting fire preserves the existing outcome rules')
    assert.ok(scene.children.some(view => view.body === body && view.sheet?.art.src === actorArt['partisan-rear'].src))
  }
})

test('a deployed contact mine damages the player once and leaves no target in the next stage', async t => {
  const { default: Scene } = await import('/scenes/camac/Main.js')
  const scene = new Scene({ stage: 0 })
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  const field = scene.minefield
  const point = field.pending[0]
  Object.assign(scene.player, point)
  scene.cameraX = scene.projection.point(scene.player).x
  const before = scene.player.health.current
  field.update()
  const [{ body }] = field.mines
  assert.equal(body.dead, true)
  assert.equal(scene.player.health.current, before - 35)
  field.update()
  assert.equal(scene.player.health.current, before - 35, 'a detonated mine cannot hit twice')
  field.clear()
  assert.equal(scene.targets.includes(body), false)
  assert.equal(scene.children.includes(body), false)
  assert.equal(field.pending.length, 0)
})
