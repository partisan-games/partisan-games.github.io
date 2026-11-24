import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createPageElements } from './helpers/dom.js'
import art from '/core/actor/advanceArt.js'
import { duration, soldierAt, soldiers } from '/scenes/bitka/Battle.js'

test('the scene selects every intended infantry pose and the right fire clip after kneeling', () => {
  const seen = { gunner: new Set(), rifleman: new Set() }
  for (let frame = 0; frame / 120 < duration; frame++) for (const soldier of soldiers) {
    const unit = soldierAt(soldier, frame / 120)
    seen[unit.kind].add(unit.pose)
    assert.ok(art[unit.kind].clips[unit.pose])
    assert.ok(unit.poseTime >= 0)
    if (unit.shotAge < .42) assert.ok(art[unit.kind].clips[unit.shot].muzzles.length)
  }
  assert.deepEqual([...seen.gunner].sort(), ['fire', 'walk'])
  assert.deepEqual([...seen.rifleman].sort(), ['crouch', 'crouch-fire', 'fire', 'kneel', 'walk', 'walk-aim'])
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

test('all four atlases match their runtime grids, anchors and recorded assets', async() => {
  const { assets } = JSON.parse(await readFile('assets/images/sources/germans-advance/sprites.json', 'utf8'))
  assert.equal(assets.length, 4)
  for (const asset of assets) {
    const runtime = art[asset.id.slice('advance-'.length)]
    const bytes = await readFile(`assets/images/${runtime.src}`)
    assert.equal(bytes.readUInt32BE(16), runtime.width * asset.frame.columns)
    assert.equal(bytes.readUInt32BE(20), runtime.height * asset.frame.rows)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    assert.deepEqual(runtime.anchor, asset.anchor)
    for (const { name, ms, muzzles } of asset.animations) {
      assert.deepEqual(runtime.clips[name].ms, ms)
      assert.deepEqual(runtime.clips[name].muzzles, muzzles)
    }
  }
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
  assert.deepEqual(draws.map(({ flip, x }) => [flip, x]), [[1, 200], [1, 222], [-1, 200], [-1, 178]])
  assert.equal(draws[0].row, art.tank.height)
  assert.notEqual(draws[0].column, draws[2].column)
  assert.equal(draws[1].image, sprite.crew.image)
  assert.notEqual(draws[1].column, draws[3].column)
})
