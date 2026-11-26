import { searchTree, copyNames } from './navigation.js'

/**
 * The art catalog: the folders of the armies art and of the 3D models, from the list scripts/build-art-catalog.py
 * writes, as a tree and a gallery of the folder the address names, as `#2d/ameri/diverzanti`. A model's name after its
 * folder, as `#3d/nature/trees/oak.glb`, shows that model at once.
 */
const { sections } = await fetch('/art/catalog.json').then(response => response.json())

const plural = (n, [one, few, many]) => {
  const last = n % 10, tens = n % 100
  return `${n} ${last === 1 && tens !== 11 ? one : last >= 2 && last <= 4 && !(tens >= 12 && tens <= 14) ? few : many}`
}
const element = html => Object.assign(document.createElement('template'), { innerHTML: html }).content
const escape = text => text.replace(/[&<>"]/g, sign => `&#${sign.charCodeAt(0)};`)

/** Every folder by its path: its title, files, subfolders, section and the folder above it. */
const folders = new Map()
const root = { path: '', title: 'Art katalog', files: [], children: [] }
folders.set('', root)
function add(data, parent, section, path, source) {
  const node = { path, title: data.title ?? data.name, files: data.files, section, parent, source, children: [] }
  folders.set(path, node)
  node.children = data.folders.map(child => add(child, node, section, `${path}/${child.name}`, `${source}/${child.name}`))
  node.total = node.files.length + node.children.reduce((sum, child) => sum + child.total, 0)
  return node
}
root.children = sections.map(section => add(section, root, section, section.path, section.source))

const isModels = node => node.section?.path === '3d'
/** The models of a 3D folder listed in the tree; a folder's only model needs none, as its page shows it at once. */
const modelsIn = node => isModels(node) && node.files.length > 1 ? node.files : []

function tree(node) {
  const rows = node.children.map(child => {
    const link = `<a href="#${escape(child.path)}">${escape(child.title)}</a>`
    const inner = child.children.length || modelsIn(child).length
      ? `<details><summary>${link}</summary>${tree(child)}</details>` : link
    return `<li data-path="${escape(child.path)}">${inner}</li>`
  })
  for (const [name] of modelsIn(node))
    rows.push(`<li data-path="${escape(`${node.path}/${name}`)}"><a class="model-link" href="#${escape(`${node.path}/${name}`)}">${escape(name)}</a></li>`)
  return `<ul>${rows.join('')}</ul>`
}

const nav = document.querySelector('.tree')
nav.append(element(tree(root)))
searchTree(document.getElementById('folder-search'), nav, document.getElementById('no-folders'))
const content = document.querySelector('.folder')
copyNames(content)
const view = document.querySelector('.model-view')
let viewer = null

function copyButton(path) {
  return `<button type="button" class="copy-name" data-copy-path="${escape(path)}" title="Kopiraj relativnu putanju">${escape(path.split('/').pop())}</button>`
}

function picture(node, [name, width, height]) {
  const path = `${node.source}/${name}`, src = encodeURI(`/${path}`)
  return `<figure><a href="${src}" target="_blank" rel="noopener"><span class="preview"><img src="${src}" loading="lazy" decoding="async"
    width="${width}" height="${height}" alt="${escape(name.replace(/\.[^.]+$/, ''))}"></span></a>
    <figcaption>${copyButton(path)}<small>${width} × ${height} px <span data-copy-status role="status"></span></small></figcaption></figure>`
}

function model(node, [name, megabytes]) {
  return `<figure><a class="show-model" href="#${escape(`${node.path}/${name}`)}"><span class="preview">Prikaži u 3D</span></a>
    <figcaption>${copyButton(`${node.source}/${name}`)}<small>${megabytes.toFixed(1)} MB <span data-copy-status role="status"></span></small></figcaption></figure>`
}

/** The folder and the model the address names; a name that is not a folder may be a model of the folder above. */
function chosen() {
  const path = decodeURIComponent(location.hash.slice(1))
  if (folders.has(path)) return { node: folders.get(path) }
  const cut = path.lastIndexOf('/'), node = folders.get(path.slice(0, cut))
  const file = node?.files.find(([name]) => name === path.slice(cut + 1))
  return node && file && isModels(node) ? { node, file } : { node: root }
}

async function show() {
  const { node, file } = chosen()
  document.title = node === root ? 'Art katalog' : `${node.title} · Art katalog`
  document.querySelector('h1').textContent = node.title
  const chain = []
  for (let step = node; step; step = step.parent) chain.unshift(step)
  document.querySelector('.crumbs').replaceChildren(element(['<a href="/index.html">Igre</a>', ...chain.map(step =>
    step === node ? `<span aria-current="page">${escape(step.title)}</span>` : `<a href="#${escape(step.path)}">${escape(step.title)}</a>`)]
    .join('<span aria-hidden="true"> / </span>')))

  for (const link of nav.querySelectorAll('[aria-current]')) link.removeAttribute('aria-current')
  const current = nav.querySelector(`li[data-path="${CSS.escape(node.path)}"] > a, li[data-path="${CSS.escape(node.path)}"] > details > summary > a`)
  current?.setAttribute('aria-current', 'page')
  for (const step of chain.slice(1))
    nav.querySelector(`li[data-path="${CSS.escape(step.path)}"] > details`)?.setAttribute('open', '')
  current?.scrollIntoView?.({ block: 'nearest' })

  const folderList = node.children.length ? `<nav aria-label="Podfolderi"><ul class="folders">${node.children.map(child =>
    `<li><a href="#${escape(child.path)}">${escape(child.title)}<small>${plural(child.total, child.section.units)}</small></a></li>`).join('')}</ul></nav>` : ''
  const cards = node.files.map(item => (isModels(node) ? model : picture)(node, item)).join('')
  const empty = !node.files.length && !node.children.length ? `<p>U ovom folderu nema ${node.section.units[2]}.</p>` : ''
  content.replaceChildren(element(folderList + (cards ? `<div class="gallery">${cards}</div>` : '') + empty))

  view.hidden = !isModels(node) || !node.files.length
  const shown = file ?? (isModels(node) && node.files.length === 1 ? node.files[0] : null)
  if (!shown) return
  viewer ??= (await import('./modelViewer.js')).default(view)
  const [name, , mtl] = shown
  const folder = node.path.slice(node.section.path.length + 1)
  viewer.show({ file: [folder, name].filter(Boolean).join('/'), mtl: mtl && [folder, mtl].filter(Boolean).join('/') })
}

window.addEventListener('hashchange', show)
show()
