// Checks what the browser would only report at runtime: broken imports, missing assets and menu entries without a scene.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirs = ['core', 'core3d', 'scenes', 'ui']
const scenesOutsideMenu = ['lookat-cursor', 'graffiti-city-maze']
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
  for (const [, path] of text.matchAll(/data-path="([^"]+)"/g)) {
    menuPaths.add(path)
    if (!scenes.includes(path)) report(join(root, 'index.html'), i + 1, `menu entry without scene "${path}"`)
  }
  for (const [, src] of text.matchAll(/src="(\/assets\/[^"]+)"/g))
    if (!assetExists(src)) report(join(root, 'index.html'), i + 1, `asset not found "${src}"`)
})

scenes
  .filter(scene => !menuPaths.has(scene) && !scenesOutsideMenu.includes(scene))
  .forEach(scene => report(join(root, 'scenes', scene, 'Main.js'), 1, 'scene missing from the menu in index.html'))

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problem(s)`)
  process.exit(1)
}
console.log(`OK: ${sourceFiles.length} files, ${scenes.length} scenes`)
