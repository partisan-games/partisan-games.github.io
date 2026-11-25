import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createPageElements } from './helpers/dom.js'
import art from '/core/actor/advanceArt.js'
import optimizedImages from '/core/actor/optimizedImages.js'
import { duration, soldierAt, soldiers } from '/scenes/bitka/Battle.js'

test('the scene selects every intended infantry pose and the right fire clip after kneeling', () => {
  const seen = Object.fromEntries(['gunner', 'rifleman', 'backpack', 'officer'].map(kind => [kind, new Set()]))
  for (let frame = 0; frame / 120 < duration; frame++) for (const soldier of soldiers) {
    const unit = soldierAt(soldier, frame / 120)
    seen[unit.kind].add(unit.pose)
    assert.ok(art[unit.kind].clips[unit.pose])
    assert.ok(unit.poseTime >= 0)
    if (unit.shotAge < .42) assert.ok(art[unit.kind].clips[unit.shot].muzzles.length)
  }
  assert.deepEqual([...seen.officer].sort(), ['signal', 'walk'])
  assert.deepEqual([...seen.backpack].sort(), ['fire', 'walk'])
  assert.deepEqual([...seen.gunner].sort(), ['fire', 'walk'])
  assert.deepEqual([...seen.rifleman].sort(), ['crouch-fire', 'crouch-walk', 'fire', 'kneel', 'walk', 'walk-aim'])
})

test('the rifleman raises his rifle before firing without resetting the marching phase', () => {
  const rifleman = soldiers.find(soldier => soldier.kind === 'rifleman')
  const march = soldierAt(rifleman, rifleman.phase - .11)
  const raising = soldierAt(rifleman, rifleman.phase - .09)
  const fire = soldierAt(rifleman, rifleman.phase + .01)
  assert.equal(march.pose, 'walk')
  assert.equal(raising.pose, 'walk-aim')
  assert.ok(raising.poseTime > march.poseTime)
  assert.equal(fire.pose, 'fire')
})

test('the advancing rifleman plants his feet to kneel and shoot, then advances with the crouch walk', () => {
  const soldier = soldiers.find(soldier => soldier.crouchAt !== undefined)
  const kneel = [soldierAt(soldier, soldier.crouchAt + .01), soldierAt(soldier, soldier.crouchAt + .15)]
  assert.ok(kneel.every(pose => pose.pose === 'kneel' && pose.shotAge === Infinity))
  assert.ok(Math.abs(kneel[0].x - kneel[1].x) < 1e-8, 'knees do not slide during the transition')
  const walk = [soldierAt(soldier, 6.45), soldierAt(soldier, 6.55)]
  assert.ok(walk.every(pose => pose.pose === 'crouch-walk'))
  assert.ok(Math.abs(walk[1].x - walk[0].x - soldier.speed * .5 * .1) < 1e-8)
  assert.ok(walk[1].poseTime > walk[0].poseTime, 'stepping follows actual distance')
  const shotAt = soldier.phase + Math.ceil((soldier.crouchAt + .175 - soldier.phase) / soldier.interval) * soldier.interval
  const fire = [soldierAt(soldier, shotAt + .02), soldierAt(soldier, shotAt + .10)]
  assert.ok(fire.every(pose => pose.pose === 'crouch-fire'))
  assert.ok(Math.abs(fire[0].x - fire[1].x) < 1e-8, 'the firing pose stays planted')
  assert.ok(Math.abs(fire[0].x - fire[0].shotX) < 1e-8, 'the muzzle stays with the stationary shooter')
  const standingShot = [soldierAt(soldier, soldier.phase + .02), soldierAt(soldier, soldier.phase + .10)]
  assert.ok(Math.abs(standingShot[0].x - standingShot[1].x) < 1e-8)
  const still = soldierAt({ ...soldier, speed: 0 }, 6.5)
  assert.equal(still.pose, 'crouch')
  assert.equal(still.x, soldier.x)
})

test('the catalog exposes and draws all six crouch-walk frames, mirrored about the same ground anchor', async() => {
  createPageElements()
  const { soldiers: stories } = await import('/catalog/stories/advance.js')
  for (const way of [1, -1]) {
    const stage = { width: 800, groundY: 500, add() {} }
    const actor = stories.find(story => story.id === 'advance-strelac').create(stage, way)
    assert.ok(actor.states.includes('crouch-walk'))
    for (const { image } of actor.children) Object.defineProperty(image, 'naturalWidth', { value: 1152, configurable: true })
    actor.setState('crouch-walk')
    actor.update(.072)
    const seen = [], anchors = [], flips = []
    const ctx = { save() {}, restore() {}, translate: (x, y) => anchors.push([x, y]),
      scale: flip => flips.push(flip), drawImage: (_image, x, y) => seen.push([x, y]) }
    for (let frame = 0; frame < 6; frame++) {
      if (frame) actor.update(.144)
      actor.render(ctx)
    }
    assert.deepEqual(seen, Array.from({ length: 6 }, (_, i) => [i * art.rifleman.width, art.rifleman.clips['crouch-walk'].row * art.rifleman.height]))
    assert.ok(anchors.every(([x, y]) => x === 400 && y === 500))
    assert.ok(flips.every(flip => flip === way))
  }
})

test('all six atlases match their runtime grids, anchors and recorded assets', async() => {
  const { assets } = JSON.parse(await readFile('assets/images/sources/germans-advance/sprites.json', 'utf8'))
  const { images: optimized } = JSON.parse(await readFile('assets/images/optimized/manifest.json', 'utf8'))
  assert.equal(assets.length, 6)
  for (const asset of assets) {
    const runtime = art[asset.id.slice('advance-'.length)]
    const bytes = await readFile(`assets/images/${runtime.src}`)
    assert.equal(bytes.readUInt32BE(16), runtime.width * asset.frame.columns)
    assert.equal(bytes.readUInt32BE(20), runtime.height * asset.frame.rows)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    if (optimizedImages[runtime.src]) {
      const copy = optimized.find(image => image.source === runtime.src)
      assert.equal(copy.runtime, optimizedImages[runtime.src])
      assert.equal(copy.sourceSha256, asset.sha256, 'the optimized copy must follow the changed atlas')
      assert.deepEqual(copy.size, [runtime.width * asset.frame.columns, runtime.height * asset.frame.rows])
      const prepared = await readFile(`assets/images/${copy.runtime}`)
      assert.equal(createHash('sha256').update(prepared).digest('hex'), copy.sha256)
    }
    assert.deepEqual(runtime.anchor, asset.anchor)
    if (asset.crewAnchor) assert.deepEqual(runtime.crewAnchor, asset.crewAnchor)
    for (const { name, ms, muzzles } of asset.animations) {
      assert.deepEqual(runtime.clips[name].ms, ms)
      assert.deepEqual(runtime.clips[name].muzzles, muzzles)
    }
  }
})

test('every advance atlas doubles pixel density while preserving world dimensions and anchors', () => {
  for (const kind of ['rifleman', 'gunner', 'backpack', 'officer']) {
    assert.deepEqual([art[kind].width, art[kind].height, art[kind].standingPixels], [192, 168, 138])
    assert.deepEqual(art[kind].anchor, { x: 62, y: 152 })
    assert.equal(art[kind].width / art[kind].standingPixels, 96 / 69)
  }
  assert.deepEqual([art.tank.width, art.tank.height, art.tank.standingPixels], [542, 282, 182])
  assert.deepEqual(art.tank.anchor, { x: 200, y: 282 })
  assert.deepEqual(art.tank.crewAnchor, { x: 206, y: 120 })
  assert.deepEqual([art.commander.width, art.commander.height, art.commander.standingPixels], [104, 92, 76])
  assert.deepEqual(art.commander.anchor, { x: 34, y: 84 })
})

test('the actual shared view animates tracks and commander and mirrors their placement together', async() => {
  createPageElements()
  const { default: AdvanceSprite } = await import('/core/actor/AdvanceSprite.js')
  const sprite = new AdvanceSprite('tank')
  for (const { image } of sprite.children) Object.defineProperty(image, 'naturalWidth', { value: 100 })
  const draws = []
  const ctx = {
    save() {},
    restore() {},
    scale(flip) {
      draws.at(-1).flip = flip
    },
    translate(x, y) {
      draws.push({ x, y })
    },
    drawImage(image, column, row) {
      Object.assign(draws.at(-1), { image, column, row })
    },
  }
  const pose = { name: 'drive', x: 200, y: 150, scale: 40 }
  sprite.draw(ctx, { ...pose, time: 0 })
  sprite.draw(ctx, { ...pose, time: .35, flip: -1 })
  const mount = (art.tank.crewAnchor.x - art.tank.anchor.x) * 40 * 2.27 / art.tank.standingPixels
  assert.deepEqual(draws.map(({ flip, x }) => [flip, x]), [[1, 200], [1, 200 + mount], [-1, 200], [-1, 200 - mount]])
  assert.equal(draws[0].row, art.tank.height)
  assert.notEqual(draws[0].column, draws[2].column)
  assert.equal(draws[1].image, sprite.crew.image)
  assert.notEqual(draws[1].column, draws[3].column)
})

test('every finished advance actor has a redrawn base and recorded generation instead of directly reusing idea art', async() => {
  const folder = 'assets/images/sources/germans-advance/'
  const { assets } = JSON.parse(await readFile(folder + 'sprites.json', 'utf8'))
  const generation = JSON.parse(await readFile(folder + 'redrawn/generation.json', 'utf8'))
  assert.equal(generation.tool, 'built-in image_gen')
  assert.equal(generation.style, 'preserve original pixel style, palette and proportions')
  assert.deepEqual(generation.assets.map(asset => asset.id).sort(), ['backpack', 'commander', 'crouch-walk', 'gunner', 'officer', 'rifleman', 'tank'])
  for (const asset of assets) {
    assert.equal(asset.redrawn, true)
    assert.equal(asset.generation, 'redrawn/generation.json')
    assert.ok(asset.sources.every(path => path.startsWith('sources/germans-advance/redrawn/')))
  }
  for (const asset of generation.assets) {
    const source = await readFile(folder + 'redrawn/' + asset.image)
    assert.equal(createHash('sha256').update(source).digest('hex'), asset.sha256)
    assert.ok(asset.prompt.length > 100 && asset.references.length)
    for (const reference of asset.references) {
      const idea = await readFile(reference)
      assert.notEqual(createHash('sha256').update(idea).digest('hex'), asset.sha256)
    }
  }
})

test('a signaling NCO stays planted, never fires, and resumes his own marching phase', () => {
  for (const soldier of soldiers.filter(unit => unit.kind === 'officer')) for (const at of soldier.signals) {
    const start = soldierAt(soldier, at + .01), end = soldierAt(soldier, at + 1.39)
    assert.equal(start.pose, 'signal')
    assert.equal(end.pose, 'signal')
    assert.equal(start.shotAge, Infinity)
    assert.ok(Math.abs(start.x - end.x) < 1e-8)
    const resumed = soldierAt(soldier, at + 1.5)
    assert.equal(resumed.pose, 'walk')
    assert.ok(resumed.x > end.x)
  }
})

test('the new catalog actors use the shared walking and signaling atlases in both directions', async() => {
  createPageElements()
  const { soldiers: stories } = await import('/catalog/stories/advance.js')
  for (const [id, kind, state] of [['advance-strelac-ranac', 'backpack', 'walk'], ['advance-podoficir', 'officer', 'signal']])
    for (const way of [1, -1]) {
      const actor = stories.find(story => story.id === id).create({ width: 800, groundY: 500, add() {} }, way)
      assert.equal(actor.children[0].art, art[kind])
      if (kind === 'officer') assert.ok(!actor.states.includes('fire'))
      Object.defineProperty(actor.children[0].image, 'naturalWidth', { value: 1152, configurable: true })
      const draws = [], anchors = [], flips = []
      const ctx = { save() {}, restore() {}, translate: (x, y) => anchors.push([x, y]),
        scale: flip => flips.push(flip), drawImage: (_image, x, y) => draws.push([x, y]) }
      actor.setState(state)
      for (const ms of art[kind].clips[state].ms) {
        actor.update(ms / 2000)
        actor.render(ctx)
        actor.update(ms / 2000)
      }
      assert.deepEqual(draws, art[kind].clips[state].ms.map((_, i) => [i * art[kind].width, art[kind].clips[state].row * art[kind].height]))
      assert.ok(anchors.every(([x, y]) => x === 400 && y === 500))
      assert.ok(flips.every(flip => flip === way))
    }
})
