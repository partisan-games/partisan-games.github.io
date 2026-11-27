import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Otpisani, streets

before(async() => {
  createPageElements()
  ;({ default: Otpisani } = await import('/scenes/otpisani/Main.js'))
  ;({ default: streets } = await import('/scenes/otpisani/streets.js'))
})

/** A running scene whose chances all come out as `chance`: below .7 a German lies in wait, above it one crosses. */
function createScene(t, chance) {
  t.mock.method(Math, 'random', () => chance)
  const scene = new Otpisani()
  scene.init()
  scene.clear = () => {}
  t.after(() => scene.end())
  scene.session.start()
  return scene
}

const target = () => document.createElement('div')
/** A click at the screen point of the world point `x`, `y`. */
const shoot = (scene, x, y) => scene.handleClick({ target: target(), pageX: x - scene.cameraX, pageY: y })

test('a German crossing the street walks in from the edge of the view for a while, then fires until he is shot', t => {
  const scene = createScene(t, .9)
  const [{ body: occupier, view }] = scene.occupiers
  assert.equal(view.x, scene.cameraX + 60, 'he comes in at the left edge of the view')
  assert.equal(occupier.forward, 1, 'he walks into the view')
  const { walkTime } = scene.walks.get(occupier)
  scene.update(walkTime - .05, 0)
  assert.equal(occupier.state, 'move')
  scene.update(.1, 0)
  assert.equal(occupier.state, 'attack')
  scene.update(1, 0)
  assert.ok(scene.energija < 100)
  for (const { body } of scene.occupiers) body.setState('dead')
  const health = scene.energija
  scene.update(1, 0)
  assert.equal(scene.energija, health)
})

test('a German behind cover rises, aims, fires, and is hit only above the cover, or hides again', t => {
  const scene = createScene(t, .1)
  const sandbags = streets[0].spots.find(spot => spot.opening && spot.opening.top === undefined)
  scene.cameraX = sandbags.from * scene.scale - 100
  scene.ambush(sandbags)
  const { body, view: shown } = scene.occupiers.at(-1)
  assert.equal(shown.sunk, 1, 'he starts hidden')
  scene.update(.3, 0)
  assert.equal(shown.sunk, 0, 'he has risen')
  const { aim, exposed } = scene.ambushes.get(body)
  scene.update(aim, 0)
  assert.equal(body.state, 'attack')
  const { view } = shown
  shoot(scene, view.x, shown.opening.bottom + 5)
  assert.equal(body.alive, true, 'the cover takes a shot below its top')
  scene.update(exposed, 0)
  assert.equal(scene.occupiers.some(occupier => occupier.body === body), false, 'unhurt, he hides again')
})

test('a German in a window rises from its sill, and is hit only inside the window', t => {
  const scene = createScene(t, .1)
  const window = streets[0].spots.find(spot => spot.opening?.top !== undefined)
  scene.cameraX = Math.max(0, window.from * scene.scale - 100)
  scene.ambush(window)
  const { body, view: shown } = scene.occupiers.at(-1)
  const { opening, view } = shown
  assert.equal(shown.sunk, 1, 'he starts below the sill')
  scene.update(.3, 0)
  assert.equal(shown.sunk, 0, 'he has risen')
  assert.ok(view.y - view.height / 2 < opening.bottom && view.y - view.height / 2 > opening.top, 'his head is in the window')
  shoot(scene, view.x, opening.bottom + 5)
  assert.equal(body.alive, true, 'the wall under the sill takes the shot')
  shoot(scene, opening.right + 2, opening.bottom - 10)
  assert.equal(body.alive, true, 'so does the wall beside the window')
  shoot(scene, view.x, (opening.bottom + view.y - view.height / 2) / 2)
  assert.equal(body.dead, true, 'a shot inside the window hits him')
})

test('each German in the lineup falls when shot in the chest, crossing or in hiding', t => {
  for (const chance of [.9, .1]) {
    const scene = createScene(t, chance)
    scene.dodajNeprijatelja()
    scene.dodajNeprijatelja()
    scene.update(.3, 0)
    for (const { body, view: shown } of scene.occupiers) {
      const view = shown.view ?? shown
      // the chest is two thirds of the way up the figure, whose feet are at the bottom of its picture
      const feet = view.inTrench === false ? view.y : view.y + view.height / 2
      shoot(scene, view.x, feet - (view.targetHeight ?? view.height) * .65)
      assert.equal(body.dead, true, `${view.constructor.name} falls when shot in the chest`)
    }
  }
})

test('the new gunners fire from doorways and cover, then stop after a hit', t => {
  const scene = createScene(t, .1)
  const door = streets[0].spots.find(spot => !spot.opening && spot.from > 60)
  const cover = streets[0].spots.find(spot => spot.opening && spot.opening.top === undefined)
  for (const [spot, kind] of [[door, 'submachineGunner'], [cover, 'machineGunner']]) {
    scene.cameraX = Math.max(0, spot.from * scene.scale - 100)
    scene.ambush(spot)
    // The first enemy in each rotation remains a rifleman.
    if (scene.occupiers.at(-1).view.view.kind !== kind) scene.ambush(spot)
    const { body, view: shown } = scene.occupiers.at(-1)
    const { view } = shown
    assert.equal(view.kind, kind)
    assert.equal(view.animation.name, 'idle')
    assert.equal(body.shotsFired, 0)
    shown.update(shown.riseTime)
    const { aim } = scene.ambushes.get(body)
    scene.lieInWait(aim + .01)
    assert.equal(view.animation.name, 'attack')
    assert.equal(body.shotsFired, 1)
    const energy = scene.energija
    scene.takeFire(.2)
    assert.ok(scene.energija < energy)
    const chest = view.y + view.height / 2 - view.targetHeight * .65
    shoot(scene, view.x, chest)
    assert.equal(body.dead, true)
    scene.lieInWait(0)
    assert.ok(!scene.occupiers.some(occupier => occupier.body === body))
  }
})

test('the street slides to its end; once its Germans have fallen the next street begins, and after the last the win', t => {
  const scene = createScene(t, .9)
  scene.update(1, 0)
  assert.ok(scene.cameraX > 0, 'the street slides by')
  scene.update(10000, 0)
  assert.equal(scene.cameraX, scene.background.length, 'it stops at its end')
  for (let index = 1; index < streets.length; index++) {
    scene.fallen = streets[index - 1].quota
    scene.update(0, 0)
    assert.equal(scene.stageIndex, index)
    assert.equal(scene.cameraX, 0)
    assert.equal(scene.fallen, 0)
  }
  scene.fallen = streets.at(-1).quota
  scene.update(0, 0)
  assert.ok(scene.ui.outro, 'the last street won is the victory')
})

test('the Panzer crosses the street, blocks bullets and stops after two bombs hit it', t => {
  const scene = createScene(t, .9)
  scene.update(8, 0)
  assert.equal(scene.tank, null)
  scene.update(1, 0)
  const { tank } = scene
  const start = tank.x
  scene.update(1, 0)
  assert.ok(tank.x > start)
  const height = tank.sprite.height * tank.pixelsPerMeter
  const y = tank.feet - height / 3
  shoot(scene, tank.x, y)
  assert.equal(tank.armor, 2)
  const throwBomb = () => scene.handleAuxClick({
    target: target(), button: 2, pageX: tank.x - scene.cameraX, pageY: y, preventDefault() {},
  })
  throwBomb()
  assert.equal(tank.armor, 1)
  assert.equal(scene.grenades, 2)
  const grenadeButton = document.createElement('button')
  grenadeButton.setAttribute('data-grenade', '')
  scene.handleClick({ target: grenadeButton })
  assert.equal(scene.grenadeArmed, true)
  shoot(scene, tank.x, y)
  assert.equal(tank.destroyed, true)
  assert.equal(scene.grenadeArmed, false)
  assert.equal(scene.grenades, 1)
  assert.equal(scene.fallen, 0, 'tank is outside the infantry quota')
  const stopped = tank.x
  tank.update(1)
  assert.equal(tank.x, stopped)
  scene.startStage(1)
  assert.ok(!scene.children.includes(tank))
  assert.equal(scene.grenades, 3)
})

test('shooting a supply crate opens it once and replenishes ammunition and grenades', t => {
  const scene = createScene(t, .9)
  const [crate] = scene.crates
  scene.cameraX = 20
  scene.ammunition = 5
  scene.grenades = 0
  shoot(scene, crate.x, crate.feet + 2)
  assert.equal(crate.state, 'closed')
  assert.equal(scene.ammunition, 4)
  const y = crate.feet - 15 * scene.scale
  shoot(scene, crate.x, y)
  assert.equal(crate.state, 'open')
  assert.equal(scene.ammunition, 15)
  assert.equal(scene.grenades, 1)
  shoot(scene, crate.x, y)
  assert.equal(scene.ammunition, 14)
  assert.equal(scene.grenades, 1)
  scene.startStage(1)
  assert.ok(!scene.children.includes(crate))
  assert.ok(scene.crates.every(({ state }) => state === 'closed'))
})

test('an empty weapon reloads after a delay so the last crate cannot end the stage early', t => {
  const scene = createScene(t, .9)
  scene.ammunition = 1
  shoot(scene, 10, 10)
  assert.equal(scene.ammunition, 0)
  const [crate] = scene.crates
  shoot(scene, crate.x, crate.feet - 10)
  assert.equal(crate.state, 'closed')
  scene.update(.5, 0)
  assert.equal(scene.ammunition, 0)
  scene.update(2, 0)
  assert.equal(scene.ammunition, 24)
})

test('a grenade fells the Germans round where it bursts, behind cover too, but not those farther off', t => {
  const scene = createScene(t, .1)
  const sandbags = streets[0].spots.find(spot => spot.opening && spot.opening.top === undefined && spot.to - spot.from > 150)
  scene.cameraX = sandbags.from * scene.scale - 100
  scene.ambush(sandbags)
  scene.update(.3, 0)
  const near = scene.occupiers.at(-1)
  const { view } = near.view
  const metre = view.height / near.body.size.height
  const far = scene.occupiers.find(({ body, view: shown }) => body !== near.body
    && Math.abs((shown.view ?? shown).x - view.x) > 3 * metre)
  scene.handleAuxClick({ button: 2, target: target(), preventDefault() {},
    pageX: view.x + metre - scene.cameraX, pageY: near.view.opening.bottom + 5 })
  assert.equal(near.body.dead, true, 'a metre off, below the top of his cover')
  if (far) assert.equal(far.body.alive, true)
  assert.equal(scene.grenades, 2)
  assert.equal(scene.fallen, 1)
})

test('on Terazije an armoured car and by Kalemegdan a half-track cross instead, shrug off bullets and fall to one grenade', async t => {
  const { default: CrossingArmoredCar } = await import('/scenes/otpisani/CrossingArmoredCar.js')
  for (const stage of [1, 2]) {
    const scene = createScene(t, .9)
    scene.startStage(stage)
    scene.update(9.5, 0)
    const { tank: car } = scene
    assert.ok(car instanceof CrossingArmoredCar, `stage ${stage}`)
    const start = car.x
    scene.update(.5, 0)
    assert.notEqual(car.x, start, 'it drives across')
    const y = car.feet - car.height / 3
    shoot(scene, car.x, y)
    assert.equal(car.destroyed, false, 'a bullet glances off')
    scene.handleAuxClick({ target: target(), button: 2, pageX: car.x - scene.cameraX, pageY: y, preventDefault() {} })
    assert.equal(car.destroyed, true, 'one grenade wrecks it')
    const stopped = car.x
    car.update(1)
    assert.equal(car.x, stopped)
  }
})

test('a crossing vehicle fires at the player only while in sight, costs him at most a fifth on its way, and stops once wrecked', t => {
  for (const stage of [0, 1, 2]) {
    const scene = createScene(t, .9)
    scene.startStage(stage)
    for (const { body } of scene.occupiers) body.setState('dead')
    const health = () => scene.energija
    scene.update(9, 0)
    const vehicle = scene.tank
    assert.ok(vehicle, `stage ${stage}`)
    const start = health()
    let crossing = 0
    while (scene.tank === vehicle && crossing < 60) {
      for (const { body } of scene.occupiers) body.setState('dead')
      scene.update(.1, 0)
      crossing += .1
    }
    const lost = start - health()
    assert.ok(lost > 0, `it fires: stage ${stage}`)
    assert.ok(lost <= 20, `it costs at most a fifth: ${lost}`)
  }
  const scene = createScene(t, .9)
  scene.update(9.5, 0)
  const { tank } = scene
  tank.armor = 0
  const left = scene.energija
  for (let i = 0; i < 50; i++) tank.update(.1)
  assert.equal(scene.energija, left, 'a wreck fires no more')
})
