import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

let kinds, createCatalog, findStory, groupOf
before(async() => {
  createPageElements()
  ;({ default: kinds } = await import('/catalog/stories/index.js'))
  ;({ createCatalog, findStory, groupOf } = await import('/catalog/catalog.js'))
})

test('redrawn scenery has its own entries, loads the game art and fits the stage', async t => {
  const scenery = [
    ['crkva-do-trsta', 'Zgrade', 'scenery/crkva-do-trsta.webp', [213, 239]],
    ['aerodrom-franjo-kluz', 'Zgrade', 'scenery/franjo-kluz/aerodrom.webp', [780, 600]],
    ['baza-vis', 'Zgrade', 'scenery/vis/baza.webp', [1536, 1024]],
    ['ostrvo-vis', 'Teren', 'scenery/vis/ostrvo.webp', [62, 63]],
    ['krater-neretva', 'Tragovi rata', 'scenery/neretva-crater.webp', [416, 124]],
    ['granata', 'Predmeti', 'projektili/granata.webp', [32, 8]],
  ]
  loadImages(t, Object.fromEntries(scenery.map(([, , path, size]) => [path, size])))
  for (const [id, group, path, [width, height]] of scenery) {
    const { kind, story } = findStory(kinds, `scenografija/${id}`)
    assert.deepEqual(groupOf(kind, story), ['Scenografija', group])
    const added = []
    const stage = { width: 640, groundY: 400, add: block => added.push(block) }
    const block = story.create(stage)
    assert.deepEqual(added, [block])
    await block.imageLoaded
    assert.ok(block.image.src.endsWith(path), id)
    assert.ok(block.width <= 576 && block.height <= 360, id)
    assert.ok(Math.abs(block.width / block.height - width / height) < 1e-9, id)
    assert.equal(block.x, stage.width / 2, id)
    if (id === 'crkva-do-trsta' || id === 'aerodrom-franjo-kluz')
      assert.equal(block.y + block.height / 2, stage.groundY, id)
  }
})

test('fallen scenery keeps one pose per faction and all battlefields link to existing props', async() => {
  const { default: sceneryArt } = await import('/core/sceneryArt.js')
  const { battlefields } = await import('/scenes/tenkici/BattleBackground.js')
  const kind = kinds.find(({ id }) => id === 'scenografija')
  const fallen = kind.stories.filter(story => groupOf(kind, story).at(-1) === 'Pali borci')
  assert.deepEqual(fallen.map(({ id }) => id),
    ['partisan-fallen-prone', 'german-fallen-supine', 'italian-fallen-side'])
  for (const battlefield of Object.values(battlefields))
    for (const { id } of battlefield.props ?? []) assert.ok(sceneryArt[id], id)
})

test('Drvar sprites stay under 2D despite needing a 3D stage, while real models stay under 3D', () => {
  const root = document.createElement('nav')
  createCatalog(root, kinds)
  for (const [kind, id, dimension] of [
    ['vojnici', 'nemacki-padobranac', '2D'],
    ['vojnici', 'nemacki-vojnik-spreda', '2D'],
    ['avioni', 'junkers-ju-52', '2D'],
    ['letelice-3d', 'junkers-ju-52-model', '3D'],
    ['scenografija-3d', 'drvar-crkva', '3D'],
  ]) {
    const link = root.querySelector(`a[href="#${kind}/${id}"]`)
    assert.ok(link, id)
    let group = link.closest('details')
    while (group.parentElement.closest('details')) group = group.parentElement.closest('details')
    assert.equal(group.querySelector(':scope > summary').textContent, dimension, id)
  }
})

test('chetniks have their own army group, not the miscellaneous one', () => {
  const soldiers = kinds.find(({ id }) => id === 'vojnici')
  const chetnik = soldiers.stories.find(({ id }) => id === 'cetnik-u-rovu')
  assert.deepEqual(groupOf(soldiers, chetnik), ['Vojnici', 'Četnici'])
  const { kind, story } = findStory(kinds, 'drugi-svetski-rat-3d/cetnik-strelac-3d')
  assert.equal(story.id, 'cetnik-strelac-3d')
  assert.deepEqual(groupOf(kind, story), ['Vojnici', 'Četnici'])
  const subara = findStory(kinds, 'drugi-svetski-rat-3d/cetnik-subara-3d')
  assert.equal(subara.story.name, 'Četnik sa šubarom')
  assert.deepEqual(groupOf(subara.kind, subara.story), ['Vojnici', 'Četnici'])
})

test('Partizani and Nemci are the first two army groups in both dimensions', () => {
  const root = document.createElement('nav')
  createCatalog(root, kinds)
  const soldiers = [...root.querySelectorAll('summary')].filter(heading => heading.textContent === 'Vojnici')
  assert.equal(soldiers.length, 2)
  for (const heading of soldiers) {
    const armies = [...heading.parentElement.querySelectorAll(':scope > section > h3')]
    assert.deepEqual(armies.slice(0, 2).map(army => army.textContent), ['Partizani', 'Nemci'])
  }
})

test('old model links resolve to separate actors instead of skins', () => {
  for (const [kind, story, selections] of [
    ['brodovi', 'nemacko-patrolno-plovilo', ['german-launch', 'german-skiff', 'german-patrol-vessel', 'rboot', 'mfp', 'vorpostenboot']],
    ['vozila', 'nemacki-tenk', ['tiger-i', 'm15-42', 'stug-iii', 'hotchkiss']],
    ['avioni', 'vis-lovac', ['bf109', 'fw190', 'sivi', 'pustinjski', 'zeleni', 'zuti-nos']],
    ['letelice-3d', 'ratni-avion-3d', ['mesersmit', 'bombarder']],
    ['vojnici', 'zastavnik', ['partizanski', 'italijanski']],
    ['vojnici', 'posada-topa', ['partizanska', 'italijanska']],
  ]) {
    const resolved = selections.map(look => findStory(kinds, `${kind}/${story}/${look}`).story)
    assert.equal(new Set(resolved).size, selections.length, story)
    for (const actor of resolved) assert.equal(actor.looks, undefined)
    assert.equal(findStory(kinds, `${kind}/${story}`).story, resolved[0])
  }
})

test('Drug Crni opens with a rifle and keeps his unarmed and pipe addresses', () => {
  const section = 'drugi-svetski-rat-3d'
  const worker = findStory(kinds, section + '/radnik-3d')
  const unarmed = findStory(kinds, section + '/radnik-3d/original')
  const pipe = findStory(kinds, section + '/radnik-3d/cev')
  const old = findStory(kinds, section + '/radnik-cev-3d')
  assert.equal(worker.story.name, 'Drug Crni')
  assert.equal(worker.look.id, 'puska')
  assert.equal(unarmed.story, worker.story)
  assert.equal(unarmed.look.name, 'Goloruk')
  assert.equal(unarmed.look.value, 'unarmed')
  assert.equal(pipe.look.id, 'cev')
  assert.equal(pipe.story, worker.story)
  assert.equal(old.story, worker.story)
  assert.equal(old.look, pipe.look)
  const resistance = findStory(kinds, section + '/borac-pokreta-otpora-3d')
  assert.equal(resistance.story, worker.story)
  assert.equal(resistance.look.id, 'puska')
  assert.ok(!worker.kind.stories.some(story => story.id === 'radnik-cev-3d'))
})

test('old infantry links open the equipment of the right individual', async() => {
  const { italianLooks } = await import('/core3d/actor/derived/ww2/italianLooks.js')
  const { variants } = await import('/core3d/actor/derived/ww2/partisanLooks.js')
  const open = path => findStory(kinds, `drugi-svetski-rat-3d/${path}`)
  for (const [prefix, choices] of [['italijanski-branilac-3d', italianLooks], ['saborci-jablanica', variants]])
    for (const [id, value] of Object.entries(choices)) {
      const resolved = open(`${prefix}/${id}`)
      assert.equal(resolved.look?.value, value, id)
      assert.equal(open(`${resolved.story.id}/${resolved.look.id}`).look, resolved.look)
    }
  const italianSoldiers = Object.keys(italianLooks).map(id => open(`italijanski-branilac-3d/${id}`).story)
  assert.equal(new Set(italianSoldiers).size, italianSoldiers.length)
  assert.equal(open('vojnik-3d-italian-rifle/italian-rifleCoat').look.value, italianLooks.rifleCoat)

  const { story: lowpoly, look: lowpolyOriginal } = open('partizan-jednostavan-model-3d')
  assert.equal(lowpoly.name, 'Savo')
  assert.equal(lowpolyOriginal.name, 'Osnovna')
  assert.equal(open('partizan-jednostavan-model-3d/original').look, lowpolyOriginal)
  for (const id of ['smedji', 'zimski', 'maslinasti']) {
    const oldRole = open(`partizan-jednostavan-model-3d-${id}`)
    assert.equal(oldRole.story, lowpoly)
    assert.equal(oldRole.look.value, variants[id])
  }
  const partisan = id => open(`saborci-jablanica/${id}`).story
  const nikoletina = open('sovjetski-partizan-3d')
  assert.equal(nikoletina.story.name, 'Nikoletina')
  assert.deepEqual(groupOf(nikoletina.kind, nikoletina.story), ['Vojnici', 'Partizani'])
  assert.equal(nikoletina.look.name, 'Pixel art', 'Pixel art is his default look (owner, 2026-11-26)')
  assert.deepEqual(nikoletina.story.looks.map(({ id }) => id), ['pixel-art', 'jugoslovenska', 'mitraljezac'])
  const jugoslovenska = open('sovjetski-partizan-3d/jugoslovenska')
  assert.equal(jugoslovenska.story, nikoletina.story)
  assert.equal(jugoslovenska.look.name, 'Jugosloven')
  assert.equal(open('sovjetski-partizan-3d/original').look, nikoletina.look, 'an unknown look opens the default')
  assert.equal(partisan('indigo'), partisan('brkovi'))
  assert.equal(partisan('brkovi').name, 'Brka')
  assert.equal(partisan('vuna'), partisan('sivi'))
  assert.notEqual(partisan('indigo'), partisan('vuna'))

  const german = open('nemacki-mitraljezac-3d')
  const flame = open('nemacki-bacac-plamena-3d')
  assert.equal(flame.story, german.story)
  assert.equal(german.look.id, 'mitraljez')
  assert.equal(flame.look.id, 'bacac-plamena')
  assert.notEqual(german.story, open('nemacki-vojnik-3d').story)
})

test('Pixel art is the default look of Borac sa Sutjeske, and Sutjeska and Maskirna keep their addresses', () => {
  const path = 'drugi-svetski-rat-3d/partizan-3d'
  const original = findStory(kinds, `${path}/original`)
  const candidate = findStory(kinds, `${path}/sutjeska`)
  assert.equal(candidate.story, original.story)
  assert.equal(candidate.story.name, 'Borac sa Sutjeske')
  assert.equal(candidate.look.id, 'sutjeska')
  assert.equal(candidate.look.name, 'Sutjeska')
  assert.ok(candidate.story.looks.includes(candidate.look))
  assert.equal(original.look.name, 'Maskirna')
  assert.equal(findStory(kinds, path).look.id, 'pixel-art')
})

test('search opens matching paths, restores disclosures and selection opens every ancestor', async() => {
  const root = document.createElement('nav')
  const storage = { value: '{"2D":false,"2D/Brodovi":false}', getItem() {
    return this.value
  }, setItem(key, value) {
    this.value = value
  } }
  const catalog = createCatalog(root, kinds, storage)
  const search = root.querySelector('input')
  search.value = 'mali camac'
  search.dispatchEvent(new Event('input'))
  const matches = [...root.querySelectorAll('a')].filter(link => !link.hidden)
  assert.equal(matches.length, 1)
  let parent = matches[0].parentElement
  while (parent !== root) {
    if (parent.tagName === 'DETAILS') assert.equal(parent.open, true)
    parent = parent.parentElement
  }
  search.value = ''
  search.dispatchEvent(new Event('input'))
  assert.equal(matches[0].closest('details').open, false)
  const { kind, story } = findStory(kinds, 'brodovi/nemacko-patrolno-plovilo/german-skiff')
  catalog.select(kind, story)
  assert.equal(matches[0].getAttribute('aria-current'), 'true')
  assert.equal(matches[0].closest('details').open, true)
  await new Promise(resolve => {
    setTimeout(resolve, 10)
  })
  const restored = document.createElement('nav')
  createCatalog(restored, kinds, storage)
  assert.equal(restored.querySelector('details').open, true)
  assert.equal(matches[0].parentElement.tagName, 'DETAILS')
  for (const link of root.querySelectorAll('a')) {
    let disclosures = 0
    for (let parent = link.parentElement; parent !== root; parent = parent.parentElement)
      if (parent.tagName === 'DETAILS') disclosures++
    assert.equal(disclosures, 2, link.textContent)
  }
  const ostali = [...root.querySelectorAll('h3')].find(heading => heading.textContent === 'Ostali').parentElement
  assert.equal(ostali, ostali.parentElement.lastElementChild)
  const italian = [...root.querySelectorAll('h3')].find(heading => heading.textContent === 'Italijani')
  assert.equal(italian.parentElement.tagName, 'SECTION')
  search.value = 'nema-takvog-aktera'
  search.dispatchEvent(new Event('input'))
  assert.equal(root.querySelector('p').hidden, false)
})
