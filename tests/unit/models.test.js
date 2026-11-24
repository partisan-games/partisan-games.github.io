import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requestModel, loadedModel } from '/core3d/assets/models.js'

test('importing a character module loads no model; using it before its load says what to await', async() => {
  const { model, description } = await import('/core3d/actor/derived/ww2/Worker.js')
  const { default: makeCharacter } = await import('/core3d/actor/characters/makeCharacter.js')

  assert.throws(() => loadedModel(model), /await requestModel\(\) in init\(\)/)
  assert.throws(() => makeCharacter(description), /before it has loaded/)
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
  const { default: makeWarplane } = await import('/core3d/actor/aircraft/makeWarplane.js')
  for (const name of ['Biplane', 'Bomber', 'Messerschmitt']) {
    const { models, description } = await import(`/core3d/aircraft/derived/${name}.js`)
    assert.ok(models.length >= 1, name)
    assert.throws(() => makeWarplane(description), /before it has loaded/, name)
  }
})

test('every game entry point waits for its model modules, including scene parts that re-export their models', async() => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs')
  const { basename, dirname, join, relative, resolve } = await import('node:path')
  const root = process.cwd()
  const walk = dir => readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.js') ? [path] : []
  })
  const sceneFiles = walk(join(root, 'scenes'))
  const describes = new Set([...walk(join(root, 'core3d')), ...sceneFiles]
    .filter(path => /^export (?:const models\b|\{\s*models\s*\})/m.test(readFileSync(path, 'utf8')))
    .map(path => '/' + relative(root, path).replaceAll('\\', '/')))

  const problems = []
  // Parts use prepared models synchronously; the game's entry point owns the awaited preload.
  // The actual scene tests construct those parts after init, so a missing model still fails at runtime.
  for (const file of sceneFiles.filter(path => basename(path) === 'Main.js')) {
    const text = readFileSync(file, 'utf8')
    for (const [, clause, imported] of text.matchAll(/^import (.+?) from '([^']+)'/gm)) {
      if (!imported.startsWith('/') && !imported.startsWith('.')) continue
      const path = imported.startsWith('/') ? imported
        : '/' + relative(root, resolve(dirname(file), imported)).replaceAll('\\', '/')
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
