// Checks what the browser would only report at runtime: broken imports, missing assets, menu entries without a scene
// and pages that reach a bare import, as `three`, without the import map that names it.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirs = ['core', 'core3d', 'scenes', 'ui', 'pages']
const assetExtensions = 'png|jpe?g|gif|webp|svg|fbx|glb|gltf|obj|mtl|dae|md2|mp3|ogg|wav|m4a|bvh|ttf|otf|woff2?'

const problems = []
const toPosix = path => path.split(sep).join('/')
const report = (file, line, message) => problems.push(`${toPosix(relative(root, file))}:${line} ${message}`)

const listFiles = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? listFiles(path) : [path]
})

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
const importMap = JSON.parse(indexHtml.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports

function resolveImport(specifier, fromFile) {
  if (importMap[specifier]) return join(root, importMap[specifier])
  const prefix = Object.keys(importMap).find(key => key.endsWith('/') && specifier.startsWith(key))
  if (prefix) return join(root, importMap[prefix], specifier.slice(prefix.length))
  if (specifier.startsWith('/')) return join(root, specifier)
  if (specifier.startsWith('.')) return resolve(dirname(fromFile), specifier)
  return null
}

const assets = listFiles(join(root, 'assets')).map(path => toPosix(relative(root, path)))
const assetExists = literal => {
  const path = literal.replace(/^\//, '').split('?')[0]
  return path.startsWith('assets/') ? assets.includes(path) : assets.some(asset => asset.endsWith(`/${path}`))
}

const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/g
const assetPattern = new RegExp(`['"\`]([^'"\`\\s$]+\\.(?:${assetExtensions}))['"\`]`, 'gi')

const sourceFiles = sourceDirs
  .flatMap(dir => listFiles(join(root, dir)))
  .filter(file => /\.(js|html|css)$/.test(file))

for (const file of sourceFiles)
  readFileSync(file, 'utf8').split('\n').forEach((text, i) => {
    if (text.trim().startsWith('//')) return

    if (file.endsWith('.js'))
      for (const [, specifier] of text.matchAll(importPattern)) {
        const target = resolveImport(specifier, file)
        if (!target) report(file, i + 1, `unknown import "${specifier}"`)
        else if (!existsSync(target)) report(file, i + 1, `import not found "${specifier}"`)
      }

    for (const [, literal] of text.matchAll(assetPattern))
      if (literal.includes('/') && !assetExists(literal)) report(file, i + 1, `asset not found "${literal}"`)
  })

const scenes = readdirSync(join(root, 'scenes')).filter(name => existsSync(join(root, 'scenes', name, 'Main.js')))
const menuPaths = new Set()
indexHtml.split('\n').forEach((text, i) => {
  // a cabinet on the home page, or a trial level's link among the links shown only in development
  for (const [, path] of text.matchAll(/(?:data-path="|href="\/#)([\w-]+)"/g)) {
    menuPaths.add(path)
    if (!scenes.includes(path)) report(join(root, 'index.html'), i + 1, `menu entry without scene "${path}"`)
  }
  for (const [, src] of text.matchAll(/src="(\/assets\/[^"]+)"/g))
    if (!assetExists(src)) report(join(root, 'index.html'), i + 1, `asset not found "${src}"`)
})

scenes
  .filter(scene => !menuPaths.has(scene))
  .forEach(scene => report(join(root, 'scenes', scene, 'Main.js'), 1, 'scene missing from the menu in index.html'))

/** The bare specifiers, as `three`, that a module reaches through its imports. */
const bareImports = new Map()
function reachedBare(file, seen = new Set()) {
  if (bareImports.has(file)) return bareImports.get(file)
  if (seen.has(file) || !existsSync(file)) return new Set()
  seen.add(file)
  const found = new Set()
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(importPattern))
    if (!/^[./]/.test(specifier)) found.add(specifier.split('/')[0])
    else for (const name of reachedBare(resolveImport(specifier, file), seen)) found.add(name)

  bareImports.set(file, found)
  return found
}

const htmlPages = ['index.html', ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)]
for (const page of htmlPages) {
  const html = readFileSync(join(root, page), 'utf8')
  const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)
  const names = map ? Object.keys(JSON.parse(map[1]).imports).map(name => name.replace(/\/$/, '')) : []
  const modules = [
    ...[...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map(([, src]) => join(root, src)),
    ...[...html.matchAll(importPattern)].map(([, specifier]) => resolveImport(specifier, join(root, page))),
  ].filter(Boolean)
  const missing = new Set(modules.flatMap(module => [...reachedBare(module)]).filter(name => !names.includes(name)))
  for (const name of missing) report(join(root, page), 1, `imports "${name}" without an import map for it`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problem(s)`)
  process.exit(1)
}
console.log(`OK: ${sourceFiles.length} files, ${scenes.length} scenes`)
