// Run against the same local project server as probe-catalog-art.mjs.
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.CATALOG_URL || 'http://localhost:8080'
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.routeWebSocket('**', () => {})
  await page.goto(base + '/catalog.html#vozila/nemacki-tenk')
  await page.waitForSelector('#catalog-panel h2')
  const rows = await page.evaluate(async() => {
    const { requestModels } = await import('/core3d/assets/models.js')
    const { Box3, Vector3, Scene } = await import('three')
    const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')
    const { fantasy, ww2, horror, beasts } = await import('/catalog/stories/characters3d.js')
    const round = value => Math.round(value * 1000) / 1000
    function bounds(mesh) {
      mesh.updateMatrixWorld(true)
      const box = new Box3().setFromObject(mesh, true)
      return [box.min.y, box.max.y].map(round)
    }
    const reports = []
    for (const { id, block, unavailable } of [...fantasy, ...horror, ...ww2, ...beasts]) {
      const row = { id }
      reports.push(row)
      if (unavailable) {
        row.unavailable = unavailable
        continue
      }
      let view
      try {
        await requestModels(block.models)
        const { body, model } = makeCharacter(block.description)
        view = model
        new Scene().add(model.mesh)
        await import('/core3d/Particles.js')
        const step = dt => {
          body.update(dt)
          model.update(dt, body.stateTime)
        }
        step(0)
        row.idle = [model.clip, model.actions[model.clip]?.getClip().name ?? 'pose', bounds(model.mesh)]
        body.setState('move')
        step(.1)
        row.move = [model.clip, model.actions[model.clip]?.getClip().name ?? 'translation', round(body.x)]
        if (!body.x) throw Error('Move produced no displacement')
        body.setState('idle')
        for (let i = 0; i < 20; i++) step(.05)
        row.attackEnabled = body.states.includes('attack')
        if (!row.attackEnabled) {
          body.setState('attack')
          body.attack()
          step(1)
          if (body.shotsFired || body.swing || body.state === 'attack') throw Error('Unsupported blow')
        }
        row.actions = []
        for (const name of body.acts) {
          const before = body.shotsFired
          body.act(name)
          model.update(0, 0)
          const show = model.actions[model.clip]?.getClip().name ?? (model.flameKind ? 'effect' : model.clip)
          let burn = false, origin = null, weaponError = null
          if (name === 'jump')
            for (let i = 0; i < 120; i++) step(.05)
          else {
            const dt = Math.min(.025, body.swing.length / 5)
            for (let i = 0; i < 1500 && body.swing; i++) {
              step(dt)
              if (!model.burning) continue
              burn = true
              origin = model.flame.mesh.position.toArray().map(round)
              if (model.flameKind.weaponMuzzle) {
                const muzzle = model.anim.twoHandedWeapon.localToWorld(new Vector3(...model.flameKind.weaponMuzzle))
                weaponError = Math.max(weaponError ?? 0, round(muzzle.distanceTo(model.flame.mesh.position)))
              }
            }
            if (body.swing || model.burning) throw Error('Action did not end: ' + name)
          }
          const events = body.shotsFired - before
          const lands = ['attack', 'attack2', ...body.area.kinds].includes(name)
          if (events !== Number(lands) || weaponError > .001) throw Error('Wrong blow or muzzle: ' + name)
          row.actions.push({ name, show, events, burn, origin, weaponError })
        }
        if (model.flameKind?.weaponMuzzle) {
          body.act('attack2')
          step(.02)
          const active = model.burning
          body.setState('idle')
          step(.02)
          row.interruptedFlameStopped = active && !model.burning && !model.flame.mesh.visible
          if (!row.interruptedFlameStopped) throw Error('Interrupted flame remained active')
        }
        body.takeHit(1)
        model.update(0, 0)
        row.hit = body.hurt > 0 ? model.actions[model.clip]?.getClip().name : 'health'
        body.setState('dead')
        for (let i = 0; i < 80; i++) step(.1)
        row.dead = { clip: model.actions.death?.getClip().name ?? model.deathPose ?? (model.ascend ? 'ascend' : null),
          feet: round(body.feet), bounds: bounds(model.mesh), visible: model.mesh.visible }
        for (let i = 0; i < 5; i++) step(.1)
        row.dead.held = row.dead.bounds.join('/') === bounds(model.mesh).join('/') || !model.mesh.visible
        if (!row.dead.held || (!model.ascend && Math.abs(row.dead.bounds[0] - row.dead.feet) > .08))
          throw Error('Final pose did not settle on the ground')
      } catch (error) {
        row.error = String(error)
      } finally {
        view?.end()
      }
    }
    return reports
  })
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/character-actions-audit.json', JSON.stringify(rows, null, 2) + '\n')
  const failures = rows.filter(row => row.error)
  const unavailable = rows.filter(row => row.unavailable)
  for (const row of failures) console.error(row.id, row.error)
  console.log(`${rows.length - failures.length - unavailable.length}/${rows.length} checked, ${unavailable.length} unavailable, ${failures.length} failed; test-results/character-actions-audit.json`)
  if (failures.length) process.exitCode = 1
} finally {
  await browser.close()
}
