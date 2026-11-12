import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requestModel, loadedModel } from '/core3d/assets/models.js'

test('importing a character module loads no model; using it before its load says what to await', async() => {
  const { model, SorceressPlayer } = await import('/core3d/actor/derived/fantasy/Sorceress.js')
  const golem = await import('/core3d/actor/derived/fantasy/Golem.js')

  assert.throws(() => loadedModel(model), /await requestModel\(\) in init\(\)/)
  assert.throws(() => new SorceressPlayer(), /before it has loaded/)
  assert.throws(() => new golem.GolemAI(), /before it has loaded/)
})

test('requests for the same model while it loads share one load', async() => {
  const model = { prefix: 'character/test/', file: 'shared.fbx' }
  const first = requestModel(model)
  const second = requestModel({ ...model })
  assert.equal(first, second)
  await first.catch(() => {}) // there is no model file in the unit tests
})

test('a failed load is forgotten, so the next request tries again', async() => {
  const model = { file: 'broken.unknown' }
  const first = requestModel(model)
  await assert.rejects(first, /Unknown file extension/)
  const second = requestModel(model)
  assert.notEqual(second, first)
  await assert.rejects(second, /Unknown file extension/)
})

test('one file prepared at two sizes is two models', async() => {
  const small = requestModel({ file: 'item/test.fbx', size: 1 })
  const large = requestModel({ size: 2, file: 'item/test.fbx' })
  assert.notEqual(small, large)
  assert.equal(requestModel({ size: 1, file: 'item/test.fbx' }), small, 'the order of the fields does not matter')
  await Promise.allSettled([small, large])
})

test('every aircraft module loads nothing when imported and names the models it needs', async() => {
  for (const name of ['Biplane', 'Bomber', 'F18', 'Messerschmitt', 'Triplane', 'Dirigible']) {
    const { models, default: Aircraft } = await import(`/core3d/aircraft/derived/${name}.js`)
    assert.ok(models.length >= 1, name)
    assert.throws(() => new Aircraft({}), /before it has loaded/, name)
  }
})

test('every game that imports a model module also waits for its models before using them', async() => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs')
  const { join, relative } = await import('node:path')
  const root = process.cwd()
  const walk = dir => readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.js') ? [path] : []
  })
  const describes = new Set(walk(join(root, 'core3d'))
    .filter(path => /^export const models\b/m.test(readFileSync(path, 'utf8')))
    .map(path => '/' + relative(root, path).replaceAll('\\', '/')))

  const problems = []
  for (const file of walk(join(root, 'scenes'))) {
    const text = readFileSync(file, 'utf8')
    for (const [, clause, path] of text.matchAll(/^import (.+?) from '(\/core3d\/[^']+)'/gm)) {
      if (!describes.has(path)) continue
      const alias = clause.match(/models as (\w+)/)?.[1]
      const awaited = alias && new RegExp(`requestModels\\([^)]*\\b${alias}\\b`).test(text)
      if (!awaited) problems.push(`${relative(root, file)} uses ${path} without requestModels`)
    }
    for (const [, path] of text.matchAll(/await import\(['`](\/core3d\/[^'`$]+(?:\$\{\w+\})?[^'`]*)['`]\)/g))
      if ([...describes].some(known => new RegExp('^' + path.replace(/\$\{\w+\}/, '\\w+') + '$').test(known))
        && !/requestModels/.test(text)) problems.push(`${relative(root, file)} imports ${path} without requestModels`)
  }
  assert.deepEqual(problems, [])
})

test('no module loads a model when it is imported', async() => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs')
  const { join, relative } = await import('node:path')
  const root = process.cwd()
  const walk = dir => readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.js') ? [path] : []
  })
  const loadingOnImport = ['core', 'core3d', 'scenes', 'ui']
    .flatMap(dir => walk(join(root, dir)))
    .filter(path => /^(export )?(const \w+ = )?await (loadModel|requestModels?)\(/m.test(readFileSync(path, 'utf8')))
    .map(path => relative(root, path).replaceAll('\\', '/'))
  assert.deepEqual(loadingOnImport, [])
})
